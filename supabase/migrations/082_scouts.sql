-- Review #24 本対応: 応募前のEngineerに対する「スカウト」機能を、
-- Scout-first flow（スカウト送信 -> Engineerが承諾/辞退 -> 承諾時のみチャット開始）
-- として追加する。
--
-- 方針:
--   1. public.scouts を新設する。company_user_id/engineer_id/message/status
--      (pending/accepted/declined) を持つ、応募(applications)とは独立した
--      新しい関係テーブル。
--   2. Company→Engineerの直接チャットは、Engineerが承諾した場合のみ許可する。
--      「無条件にチャットを開始できる」構成は採用しない。
--   3. 既存の応募ベースチャット（chat_rooms.application_id経由、012/026/036）
--      は一切変更しない。挙動もスキーマもそのまま。
--
-- chat_roomsの接続方法（検討した2案の比較）:
--   案A: application_idをnullableにし、chat_roomsにscout_idを追加。
--        exactly-one-of制約で「応募発のroomか、スカウト発のroomか」を明確に
--        区別する。
--   案B: scout自体をapplicationsのように扱う別テーブルにし、chat_roomsは
--        触らずscout_chat_roomsという別テーブルを新設する。
--   採用: 案A。理由:
--     - chat_rooms/messagesのRLS（select/update）は application_id を一切
--       参照しない設計になっている（chat_rooms_select_participant等は
--       engineer_id/company_user_idのみで判定）ため、application_idを
--       nullableにしてもSELECT/UPDATE系ポリシーは無修正で動く。
--     - PostgreSQLのUNIQUE INDEXはNULLを複数許容するため、
--       uq_chat_rooms_application（既存、application_id列）はnullable化後も
--       「実在するapplication_idについては1room」という既存の一意性保証を
--       全く変えない。
--     - messages/ChatMessageThread等のメッセージ送受信ロジック（chat_room_id
--       ベース）はorigin非依存の汎用実装のため、案Aなら1つの
--       messagesテーブル・1つのUI基盤をそのまま再利用できる。
--     - 案Bは別テーブル・別RLS・別UI基盤が必要になり、メッセージ送受信の
--       共通化ができず「最小」から外れる。
--   application_idをnullableにする際の影響確認:
--     - 既存RLS: chat_rooms_select_participant/_select_admin、
--       messages_select_participant/_insert_participant/_update_read_receipt
--       はいずれもapplication_idを参照しないため無変更で成立する。
--     - 既存UNIQUE: uq_chat_rooms_application はNULLを複数許容する
--       Postgresの標準挙動のため、既存の「1 application = 1 room」制約は
--       維持される。
--     - 既存INSERT policy（chat_rooms_insert_engineer/_company,
--       036_chat_mvp_and_message_notifications.sql）はいずれも
--       application_idが実在するapplicationsを指すことをEXISTS句で要求して
--       おり無変更。scout発のroom作成はこれらのpolicyを一切経由しない
--       （後述のSECURITY DEFINER RPCが直接INSERTする）ため、応募発のroom
--       作成条件を一切緩めない。
--
-- Security（RPC内でチェック）:
--   - send_scout: 呼び出し元がACTIVEなCOMPANYであること、
--     対象engineer_idが存在しACTIVEなENGINEERであること、自分自身への
--     送信でないこと、messageの長さ、opportunity_idを指定する場合は
--     自社の求人であること。
--   - 同一Company→同一Engineerへのpending scout重複防止:
--     部分一意インデックス (company_user_id, engineer_id) WHERE status='pending'
--     で、DBレベルで確実に防止する（RPC内の事前チェックだけだと競合状態で
--     すり抜けうるため、一意インデックスを一次防御とする）。
--   - respond_to_scout: 呼び出し元がscout.engineer_id本人であること、
--     scoutがまだpendingであること（二重応答防止）。
--   - scoutsテーブルには参加者向けのSELECTポリシーのみを付与し、
--     INSERT/UPDATE/DELETEポリシーは一切付与しない -- 書き込みは必ず
--     SECURITY DEFINER RPC経由のみとする（chat_roomsの既存設計
--     -- 026_chat_policies.sqlの「参加者への直接INSERT policyを与えない」
--     方針を踏襲）。
--
-- Rollback:
--   DROP FUNCTION public.respond_to_scout(UUID, TEXT);
--   DROP FUNCTION public.send_scout(UUID, TEXT, UUID);
--   DROP TRIGGER trg_notify_scout_received ON public.scouts;
--   DROP FUNCTION private.notify_scout_received();
--   ALTER TABLE public.notifications DROP CONSTRAINT chk_notifications_type;
--   -- (081時点の6値に戻すALTER CONSTRAINTを再実行)
--   ALTER TABLE public.chat_rooms DROP CONSTRAINT chk_chat_rooms_origin;
--   DROP INDEX uq_chat_rooms_scout;
--   ALTER TABLE public.chat_rooms DROP COLUMN scout_id;
--   ALTER TABLE public.chat_rooms ALTER COLUMN application_id SET NOT NULL;
--   DROP TABLE public.scouts;

-- ============================================================
-- 1. public.scouts
-- ============================================================

CREATE TABLE IF NOT EXISTS public.scouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
    engineer_id UUID NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
    opportunity_id UUID REFERENCES public.opportunities (id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    chat_room_id UUID REFERENCES public.chat_rooms (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_scouts_status CHECK (status IN ('pending', 'accepted', 'declined')),
    CONSTRAINT chk_scouts_message_length CHECK (char_length(message) BETWEEN 1 AND 2000),
    CONSTRAINT chk_scouts_not_self CHECK (company_user_id <> engineer_id),
    -- pending: 未応答（responded_at/chat_room_idともNULL）
    -- declined: 応答済み・チャットなし
    -- accepted: 応答済み・チャットあり
    -- を型として保証し、アプリ側の不整合な書き込みを構造的に防ぐ。
    CONSTRAINT chk_scouts_status_consistency CHECK (
        (status = 'pending' AND responded_at IS NULL AND chat_room_id IS NULL)
        OR (status = 'declined' AND responded_at IS NOT NULL AND chat_room_id IS NULL)
        OR (status = 'accepted' AND responded_at IS NOT NULL AND chat_room_id IS NOT NULL)
    )
);

-- スパム対策: 同一Company→同一Engineerへのpending scoutは同時に1件まで。
-- 辞退後は新しいpending行を作れる（部分インデックスなので declined 行とは
-- 衝突しない）。
CREATE UNIQUE INDEX IF NOT EXISTS uq_scouts_pending_company_engineer
    ON public.scouts (company_user_id, engineer_id)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scouts_engineer ON public.scouts (engineer_id);
CREATE INDEX IF NOT EXISTS idx_scouts_company ON public.scouts (company_user_id);
CREATE INDEX IF NOT EXISTS idx_scouts_opportunity ON public.scouts (opportunity_id);

DROP TRIGGER IF EXISTS trg_scouts_updated_at ON public.scouts;
CREATE TRIGGER trg_scouts_updated_at
    BEFORE UPDATE ON public.scouts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.scouts ENABLE ROW LEVEL SECURITY;

-- 参加者（送ったCompany / 受け取ったEngineer）とADMINのみ閲覧可能。
DROP POLICY IF EXISTS scouts_select_participant ON public.scouts;
CREATE POLICY scouts_select_participant
    ON public.scouts
    FOR SELECT
    TO authenticated
    USING (
        company_user_id = (SELECT auth.uid())
        OR engineer_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS scouts_select_admin ON public.scouts;
CREATE POLICY scouts_select_admin
    ON public.scouts
    FOR SELECT
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN');

-- INSERT/UPDATE/DELETEポリシーは意図的に追加しない。全ての書き込みは
-- send_scout() / respond_to_scout()（いずれもSECURITY DEFINER）経由のみ。

-- ============================================================
-- 2. chat_rooms: application_id を nullable にし、scout_id を追加
-- ============================================================

ALTER TABLE public.chat_rooms ALTER COLUMN application_id DROP NOT NULL;

ALTER TABLE public.chat_rooms
    ADD COLUMN IF NOT EXISTS scout_id UUID REFERENCES public.scouts (id) ON DELETE RESTRICT;

ALTER TABLE public.chat_rooms
    DROP CONSTRAINT IF EXISTS chk_chat_rooms_origin;
ALTER TABLE public.chat_rooms
    ADD CONSTRAINT chk_chat_rooms_origin
    CHECK (
        (application_id IS NOT NULL AND scout_id IS NULL)
        OR (application_id IS NULL AND scout_id IS NOT NULL)
    );

-- 1 scout = 1 room（応募側のuq_chat_rooms_applicationと対になる制約）。
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_rooms_scout
    ON public.chat_rooms (scout_id)
    WHERE scout_id IS NOT NULL;

-- 既存の chat_rooms_select_participant / _select_admin,
-- messages_select_participant / _insert_participant / _update_read_receipt
-- (026_chat_policies.sql) はいずれも application_id を参照しないため無変更。
-- 既存の chat_rooms_insert_engineer / _insert_company
-- (036_chat_mvp_and_message_notifications.sql) も無変更 -- 応募発のroom作成
-- 条件はそのまま。scout発のroom作成はrespond_to_scout()がSECURITY DEFINERで
-- 直接INSERTするため、新しいINSERT policyは追加しない
-- （＝クライアントから直接 scout_id 付きの chat_rooms.insert() は
-- どのロールでも許可されない）。

-- ============================================================
-- 3. notifications: scout_received を追加
-- ============================================================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS chk_notifications_type;
ALTER TABLE public.notifications
    ADD CONSTRAINT chk_notifications_type
    CHECK (
        type IN (
            'application_received', 'application_status_changed', 'new_message', 'opportunity_closed',
            'review_received', 'review_reply_received', 'scout_received'
        )
    );

CREATE OR REPLACE FUNCTION private.notify_scout_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
    INSERT INTO public.notifications
        (user_id, type, title, body, related_entity_type, related_entity_id, event_key)
    VALUES (
        NEW.engineer_id,
        'scout_received',
        '新しいスカウトが届きました',
        left(NEW.message, 255),
        'scout',
        NEW.id,
        'scout_received:' || NEW.id
    )
    ON CONFLICT (user_id, event_key) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_scout_received() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_scout_received ON public.scouts;
CREATE TRIGGER trg_notify_scout_received
    AFTER INSERT ON public.scouts
    FOR EACH ROW
    EXECUTE FUNCTION private.notify_scout_received();

-- ============================================================
-- 4. send_scout(p_engineer_id, p_message, p_opportunity_id) RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.send_scout(
    p_engineer_id UUID,
    p_message TEXT,
    p_opportunity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_role TEXT;
    v_status TEXT;
    v_engineer_role TEXT;
    v_engineer_status TEXT;
    v_message TEXT;
    v_scout_id UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT role, status INTO v_role, v_status
    FROM public.users
    WHERE id = v_uid;

    IF v_role IS DISTINCT FROM 'COMPANY' OR v_status IS DISTINCT FROM 'ACTIVE' THEN
        RAISE EXCEPTION 'active company account required' USING ERRCODE = '42501';
    END IF;

    IF p_engineer_id IS NULL THEN
        RAISE EXCEPTION 'engineer is required' USING ERRCODE = '22023';
    END IF;

    IF p_engineer_id = v_uid THEN
        RAISE EXCEPTION 'cannot send a scout to yourself' USING ERRCODE = '22023';
    END IF;

    SELECT role, status INTO v_engineer_role, v_engineer_status
    FROM public.users
    WHERE id = p_engineer_id;

    IF NOT FOUND
       OR v_engineer_role IS DISTINCT FROM 'ENGINEER'
       OR v_engineer_status IS DISTINCT FROM 'ACTIVE' THEN
        RAISE EXCEPTION 'engineer not found or not active' USING ERRCODE = '22023';
    END IF;

    v_message := btrim(p_message);
    IF v_message IS NULL OR v_message = '' OR char_length(v_message) > 2000 THEN
        RAISE EXCEPTION 'invalid scout message' USING ERRCODE = '22023';
    END IF;

    IF p_opportunity_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.opportunities
            WHERE id = p_opportunity_id
              AND posted_by = v_uid
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'opportunity not found or not owned by caller' USING ERRCODE = '22023';
        END IF;
    END IF;

    BEGIN
        INSERT INTO public.scouts (company_user_id, engineer_id, opportunity_id, message)
        VALUES (v_uid, p_engineer_id, p_opportunity_id, v_message)
        RETURNING id INTO v_scout_id;
    EXCEPTION WHEN unique_violation THEN
        RAISE EXCEPTION 'a pending scout to this engineer already exists' USING ERRCODE = '23505';
    END;

    RETURN v_scout_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_scout(UUID, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_scout(UUID, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.send_scout(UUID, TEXT, UUID) TO authenticated;

-- ============================================================
-- 5. respond_to_scout(p_scout_id, p_response) RPC
--    承諾時のみ chat_rooms を新規作成し、chat_room_id を返す。
-- ============================================================

CREATE OR REPLACE FUNCTION public.respond_to_scout(
    p_scout_id UUID,
    p_response TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_role TEXT;
    v_status TEXT;
    v_scout RECORD;
    v_chat_room_id UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT role, status INTO v_role, v_status
    FROM public.users
    WHERE id = v_uid;

    IF v_role IS DISTINCT FROM 'ENGINEER' OR v_status IS DISTINCT FROM 'ACTIVE' THEN
        RAISE EXCEPTION 'active engineer account required' USING ERRCODE = '42501';
    END IF;

    IF p_response NOT IN ('accepted', 'declined') THEN
        RAISE EXCEPTION 'invalid response' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_scout
    FROM public.scouts
    WHERE id = p_scout_id
    FOR UPDATE;

    -- 存在しない場合と他人のscoutの場合を同一エラーに畳み込み、
    -- scoutの存在有無を外部に漏らさない
    -- （getCompanyOpportunity等、既存コードの慣例と同じ設計）。
    IF NOT FOUND OR v_scout.engineer_id <> v_uid THEN
        RAISE EXCEPTION 'scout not found' USING ERRCODE = '42501';
    END IF;

    IF v_scout.status <> 'pending' THEN
        RAISE EXCEPTION 'this scout has already been responded to' USING ERRCODE = '22023';
    END IF;

    IF p_response = 'accepted' THEN
        INSERT INTO public.chat_rooms (scout_id, engineer_id, company_user_id)
        VALUES (p_scout_id, v_scout.engineer_id, v_scout.company_user_id)
        RETURNING id INTO v_chat_room_id;

        UPDATE public.scouts
        SET status = 'accepted',
            responded_at = now(),
            chat_room_id = v_chat_room_id
        WHERE id = p_scout_id;
    ELSE
        UPDATE public.scouts
        SET status = 'declined',
            responded_at = now()
        WHERE id = p_scout_id;
    END IF;

    RETURN v_chat_room_id;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_scout(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.respond_to_scout(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.respond_to_scout(UUID, TEXT) TO authenticated;
