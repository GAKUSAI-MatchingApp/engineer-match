-- Corrects the EXECUTE grant on admin_write_audit_log (051) to match its
-- documented intent: "only 'authenticated' ... may call it". Live catalog
-- verification after 051 showed anon still held EXECUTE (postgres and
-- service_role also show it, which is expected/unavoidable for those two
-- trusted roles and not touched here).
--
-- REVOKE ALL ... FROM PUBLIC in 051 does not revoke a privilege anon holds
-- via its own explicit/default-privilege grant -- PUBLIC and anon are
-- different grantees in Postgres, so anon's EXECUTE survived that REVOKE.
--
-- Not currently exploitable: the function's own body rejects any caller
-- where auth.uid() is NULL (unauthenticated) before doing anything else, so
-- an anon caller already gets rejected at runtime. This migration closes the
-- gap between the grant table and the documented least-privilege design,
-- it does not change any existing behavior for authenticated ADMIN callers.
--
-- Purely additive at the data level: revokes/grants only, no table or row
-- changes, no other migration's objects touched.

REVOKE EXECUTE ON FUNCTION public.admin_write_audit_log(TEXT, TEXT, UUID, JSONB, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_write_audit_log(TEXT, TEXT, UUID, JSONB, JSONB, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_write_audit_log(TEXT, TEXT, UUID, JSONB, JSONB, TEXT) TO authenticated;
