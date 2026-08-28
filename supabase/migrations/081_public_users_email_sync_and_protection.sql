-- Review #22 (本対応): Engineerが設定画面から自分でメールアドレスを変更できる
-- ようにするための、DB側の下ごしらえ。
--
-- 方針:
--   メールアドレスの正本は auth.users.email とする。アプリは
--   supabase.auth.updateUser({ email }) のみを呼び、public.users.email や
--   auth.users を直接UPDATEしない。GoTrueがメール変更の確認（新メール宛の
--   確認リンク、Secure Email Change有効時は旧メール宛も）を完了し、
--   auth.users.email が正式に書き換わったタイミングでのみ、このmigrationで
--   追加するtriggerが public.users.email を追従させる。
--
-- 1. private.users_protected_fields_unchanged() に email を追加
--    029_remaining_policies.sql の users_update_own ポリシーは、
--    role/status/deleted_at のみを「自己UPDATEでも値を変えられない列」として
--    保護しており、email は保護対象外だった（コメントにも
--    "name/email (and any other non-protected column) remain freely
--    editable" と明記されていた）。email の正本を auth.users 側に一本化する
--    以上、public.users.email を一般ユーザーが直接UPDATEで書き換えられる
--    経路は塞ぐ必要があるため、email もこの保護関数の対象に追加する。
--
--    citext延長機能がどのスキーマにインストールされているか
--    （public か extensions か）を前提にできないため、citextの `=`
--    演算子には依存せず、双方を ::text にキャストしてから
--    pg_catalog.lower() で比較する（pg_catalog経由のキャスト・関数だけで
--    完結し、search_pathに依存しない）。
--
--    既存の name 更新 (updateUserName, src/lib/engineer/profile.ts) は
--    email列をSET句に含めないため、UPDATE後もNEW.emailはOLD.emailのまま
--    残り、この保護チェックは無条件で通過する -- 既存の自己更新は壊れない。
--
-- 2. auth.users AFTER UPDATE OF email トリガーで public.users.email を同期
--    条件: NEW.email IS DISTINCT FROM OLD.email （かつ NULL でない）
--    処理: public.users.email = lower(NEW.email) WHERE id = NEW.id
--
--    GoTrueは変更確認が完了するまでの間、確認待ちの新メールアドレスを
--    auth.users.email 列ではなく別列（email_change、SDK上は
--    user.new_email として見える）に保持し、auth.users.email 自体は
--    確認完了まで書き換えない。そのため「AFTER UPDATE OF email」で
--    十分であり、確認前のpending emailがpublic.usersへ漏れることはない
--    （002_users.sqlのhandle_new_user()がINSERT時点のemailを一度だけ
--    コピーする既存動作と対になる、UPDATE版の追従処理）。
--
--    SECURITY DEFINER + 固定 search_path で、002_users.sqlの
--    handle_new_user()（auth.usersへの既存トリガー）と同じ権限モデルを
--    踏襲する。
--
-- 安全性:
--   - public.users.email は元々 NOT NULL のため、NEW.emailがNULLの場合は
--     同期をスキップする（このアプリはphone認証を使わないため実際には
--     起こらない想定だが、UPDATE全体を巻き込んでエラーにしないための
--     防御）。
--   - uq_users_email（002_users.sqlのcase-insensitive一意インデックス）は
--     無変更。GoTrue側のauth.users.emailにも一意制約があるため、二重に
--     一意性が守られる。
--   - RLS/既存ポリシーの構造（select系ポリシー、admin系ポリシー）は無変更。
--
-- Rollback:
--   DROP TRIGGER on_auth_user_email_updated ON auth.users;
--   DROP FUNCTION private.sync_public_user_email();
--   DROP FUNCTION private.users_protected_fields_unchanged(TEXT, TEXT, TIMESTAMPTZ, TEXT);
--   then recreate the pre-existing 3-arg version + users_update_own policy
--   from 029_remaining_policies.sql.

-- ============================================================
-- 1. email を protected fields に追加
--
-- 依存関係上、安全な順序で行う:
--   (a) 新しい4引数版を先にCREATE（3引数版とは別シグネチャなので、この時点
--       ではまだ何にも依存されない新規オブジェクトとして追加されるだけ）
--   (b) users_update_own ポリシーをDROPして4引数版を使う形で再作成
--       （この時点で3引数版への参照はDB内のどこにも残らなくなる）
--   (c) 3引数版をDROP（もう誰も参照していないので依存関係エラーは出ない）
-- 旧3引数版を先にDROPすると、まだそれを参照している既存の
-- users_update_own ポリシーが依存しているため
-- "cannot drop function ... because other objects depend on it" で失敗する。
-- ============================================================

-- (a) 新しい4引数版を先にCREATE。
CREATE OR REPLACE FUNCTION private.users_protected_fields_unchanged(
    p_role TEXT,
    p_status TEXT,
    p_deleted_at TIMESTAMPTZ,
    p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = p_role
          AND status = p_status
          AND deleted_at IS NOT DISTINCT FROM p_deleted_at
          AND pg_catalog.lower(email::text) = pg_catalog.lower(p_email)
    );
$$;

REVOKE ALL ON FUNCTION private.users_protected_fields_unchanged(TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.users_protected_fields_unchanged(TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;

-- (b) ポリシーを4引数版を使う形で切り替える。この時点で旧3引数版への参照は
-- なくなる。
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (
        id = (SELECT auth.uid())
        AND (SELECT private.users_protected_fields_unchanged(role, status, deleted_at, email))
    );

-- (c) 旧3引数版をDROP。ポリシー切替後のため依存関係エラーは発生しない。
DROP FUNCTION IF EXISTS private.users_protected_fields_unchanged(TEXT, TEXT, TIMESTAMPTZ);

-- ============================================================
-- 2. auth.users.email -> public.users.email 追従トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION private.sync_public_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email IS DISTINCT FROM OLD.email THEN
        UPDATE public.users
        SET email = pg_catalog.lower(NEW.email)
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_public_user_email() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION private.sync_public_user_email();
