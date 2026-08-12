-- Row Level Security.
--
-- Model akses: keanggotaan organisasi menentukan APA yang terlihat, peran
-- menentukan APA yang boleh diubah. Organisasi ini tertutup dan berisi beberapa
-- roster (main, academy), jadi semua anggota org boleh membaca seluruh data org —
-- yang dibatasi peran adalah penulisan.
--
-- Semua helper di bawah SECURITY DEFINER supaya bisa membaca tabel keanggotaan
-- tanpa memicu policy-nya sendiri (kalau tidak, policy `org_members` yang
-- meng-query `org_members` akan rekursi tak berujung).

-- ---------------------------------------------------------------------------
-- Helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$;

-- Boleh mengelola data operasional org: ruleset, map, format, roster, scrim.
CREATE OR REPLACE FUNCTION public.can_manage_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'coach')
  );
$$;

-- Boleh mengubah struktur org: anggota, peran, tim, undangan.
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- Org pemilik sebuah tim. Dipakai policy tabel-tabel yang bergantung ke tim.
CREATE OR REPLACE FUNCTION public.team_org_id(p_team_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT org_id FROM teams WHERE id = p_team_id;
$$;

-- Kapten tim boleh mengubah data timnya sendiri walau bukan admin org.
CREATE OR REPLACE FUNCTION public.can_manage_team(p_team_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.can_manage_org(public.team_org_id(p_team_id))
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = p_team_id AND user_id = auth.uid() AND role = 'captain'
      );
$$;

CREATE OR REPLACE FUNCTION public.can_read_team(p_team_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_org_member(public.team_org_id(p_team_id));
$$;

-- Tim pemilik seorang pemain — dipakai policy loadout & review.
CREATE OR REPLACE FUNCTION public.player_team_id(p_player_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT team_id FROM players WHERE id = p_player_id;
$$;

CREATE OR REPLACE FUNCTION public.scrim_team_id(p_scrim_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT team_id FROM scrims WHERE id = p_scrim_id;
$$;

CREATE OR REPLACE FUNCTION public.game_team_id(p_game_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.team_id FROM scrim_games g JOIN scrims s ON s.id = g.scrim_id WHERE g.id = p_game_id;
$$;

CREATE OR REPLACE FUNCTION public.ruleset_org_id(p_ruleset_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT org_id FROM rulesets WHERE id = p_ruleset_id;
$$;

-- ---------------------------------------------------------------------------
-- Aktifkan RLS di semua tabel aplikasi
-- ---------------------------------------------------------------------------

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE players             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE modes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps                ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_modes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_formats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE weapons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE perks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_skills     ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorestreaks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulesets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruleset_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruleset_map_pool    ENABLE ROW LEVEL SECURITY;
ALTER TABLE loadouts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_role_claims   ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponent_players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrims              ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrim_games         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_player_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE snd_rounds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hp_hills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctrl_rounds         ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Identitas & struktur organisasi
-- ---------------------------------------------------------------------------

-- Profil orang lain hanya terlihat kalau satu organisasi.
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.user_id = profiles.id AND m.org_id IN (SELECT public.user_org_ids())
    )
  );
CREATE POLICY profiles_update_self ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY organizations_select ON organizations FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_org_ids()));
-- Siapa pun yang login boleh membuat organisasi, tapi hanya sebagai dirinya sendiri.
CREATE POLICY organizations_insert ON organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY organizations_update ON organizations FOR UPDATE TO authenticated
  USING (public.is_org_admin(id)) WITH CHECK (public.is_org_admin(id));

CREATE POLICY org_members_select ON org_members FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
-- Baris pertama sebuah org dibuat oleh pembuatnya sendiri; sesudah itu hanya admin.
CREATE POLICY org_members_insert ON org_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_org_admin(org_id));
CREATE POLICY org_members_update ON org_members FOR UPDATE TO authenticated
  USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));
CREATE POLICY org_members_delete ON org_members FOR DELETE TO authenticated
  USING (public.is_org_admin(org_id));

CREATE POLICY teams_select ON teams FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY teams_write ON teams FOR ALL TO authenticated
  USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY team_members_select ON team_members FOR SELECT TO authenticated
  USING (public.can_read_team(team_id));
CREATE POLICY team_members_write ON team_members FOR ALL TO authenticated
  USING (public.can_manage_team(team_id)) WITH CHECK (public.can_manage_team(team_id));

CREATE POLICY players_select ON players FOR SELECT TO authenticated
  USING (public.can_read_team(team_id));
CREATE POLICY players_write ON players FOR ALL TO authenticated
  USING (public.can_manage_team(team_id)) WITH CHECK (public.can_manage_team(team_id));

-- Undangan hanya terlihat oleh admin org. Penerima mengaksesnya lewat token
-- di Server Action (service role), bukan lewat query langsung.
CREATE POLICY invitations_admin ON invitations FOR ALL TO authenticated
  USING (public.is_org_admin(org_id)) WITH CHECK (public.is_org_admin(org_id));

-- ---------------------------------------------------------------------------
-- Katalog
-- ---------------------------------------------------------------------------

-- Mode bersifat global dan hanya diubah lewat migrasi/seed.
CREATE POLICY modes_select ON modes FOR SELECT TO authenticated USING (true);

CREATE POLICY maps_select ON maps FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY maps_write ON maps FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY map_modes_select ON map_modes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM maps m WHERE m.id = map_modes.map_id
                 AND m.org_id IN (SELECT public.user_org_ids())));
CREATE POLICY map_modes_write ON map_modes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM maps m WHERE m.id = map_modes.map_id
                 AND public.can_manage_org(m.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM maps m WHERE m.id = map_modes.map_id
                      AND public.can_manage_org(m.org_id)));

CREATE POLICY series_formats_select ON series_formats FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY series_formats_write ON series_formats FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY weapons_select ON weapons FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY weapons_write ON weapons FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY attachments_select ON attachments FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY attachments_write ON attachments FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY perks_select ON perks FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY perks_write ON perks FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY utilities_select ON utilities FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY utilities_write ON utilities FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY operator_skills_select ON operator_skills FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY operator_skills_write ON operator_skills FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY scorestreaks_select ON scorestreaks FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY scorestreaks_write ON scorestreaks FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

-- ---------------------------------------------------------------------------
-- Ruleset
-- ---------------------------------------------------------------------------

CREATE POLICY rulesets_select ON rulesets FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY rulesets_write ON rulesets FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY ruleset_rules_select ON ruleset_rules FOR SELECT TO authenticated
  USING (public.is_org_member(public.ruleset_org_id(ruleset_id)));
CREATE POLICY ruleset_rules_write ON ruleset_rules FOR ALL TO authenticated
  USING (public.can_manage_org(public.ruleset_org_id(ruleset_id)))
  WITH CHECK (public.can_manage_org(public.ruleset_org_id(ruleset_id)));

CREATE POLICY ruleset_map_pool_select ON ruleset_map_pool FOR SELECT TO authenticated
  USING (public.is_org_member(public.ruleset_org_id(ruleset_id)));
CREATE POLICY ruleset_map_pool_write ON ruleset_map_pool FOR ALL TO authenticated
  USING (public.can_manage_org(public.ruleset_org_id(ruleset_id)))
  WITH CHECK (public.can_manage_org(public.ruleset_org_id(ruleset_id)));

-- ---------------------------------------------------------------------------
-- Loadout — pemain boleh mengubah punyanya sendiri, coach/kapten boleh semua
-- ---------------------------------------------------------------------------

CREATE POLICY loadouts_select ON loadouts FOR SELECT TO authenticated
  USING (public.can_read_team(public.player_team_id(player_id)));
CREATE POLICY loadouts_write ON loadouts FOR ALL TO authenticated
  USING (
    public.can_manage_team(public.player_team_id(player_id))
    OR EXISTS (SELECT 1 FROM players p WHERE p.id = loadouts.player_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    public.can_manage_team(public.player_team_id(player_id))
    OR EXISTS (SELECT 1 FROM players p WHERE p.id = loadouts.player_id AND p.user_id = auth.uid())
  );

CREATE POLICY class_role_claims_select ON class_role_claims FOR SELECT TO authenticated
  USING (public.can_read_team(public.scrim_team_id(scrim_id)));
CREATE POLICY class_role_claims_write ON class_role_claims FOR ALL TO authenticated
  USING (public.can_manage_team(public.scrim_team_id(scrim_id)))
  WITH CHECK (public.can_manage_team(public.scrim_team_id(scrim_id)));

-- ---------------------------------------------------------------------------
-- Scrim & statistik
-- ---------------------------------------------------------------------------

CREATE POLICY opponents_select ON opponents FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY opponents_write ON opponents FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY opponent_players_select ON opponent_players FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM opponents o WHERE o.id = opponent_players.opponent_id
                 AND o.org_id IN (SELECT public.user_org_ids())));
CREATE POLICY opponent_players_write ON opponent_players FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM opponents o WHERE o.id = opponent_players.opponent_id
                 AND public.can_manage_org(o.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM opponents o WHERE o.id = opponent_players.opponent_id
                      AND public.can_manage_org(o.org_id)));

CREATE POLICY scrims_select ON scrims FOR SELECT TO authenticated
  USING (public.can_read_team(team_id));
CREATE POLICY scrims_write ON scrims FOR ALL TO authenticated
  USING (public.can_manage_team(team_id)) WITH CHECK (public.can_manage_team(team_id));

CREATE POLICY scrim_games_select ON scrim_games FOR SELECT TO authenticated
  USING (public.can_read_team(public.scrim_team_id(scrim_id)));
CREATE POLICY scrim_games_write ON scrim_games FOR ALL TO authenticated
  USING (public.can_manage_team(public.scrim_team_id(scrim_id)))
  WITH CHECK (public.can_manage_team(public.scrim_team_id(scrim_id)));

CREATE POLICY game_player_stats_select ON game_player_stats FOR SELECT TO authenticated
  USING (public.can_read_team(public.game_team_id(scrim_game_id)));
CREATE POLICY game_player_stats_write ON game_player_stats FOR ALL TO authenticated
  USING (public.can_manage_team(public.game_team_id(scrim_game_id)))
  WITH CHECK (public.can_manage_team(public.game_team_id(scrim_game_id)));

CREATE POLICY snd_rounds_select ON snd_rounds FOR SELECT TO authenticated
  USING (public.can_read_team(public.game_team_id(scrim_game_id)));
CREATE POLICY snd_rounds_write ON snd_rounds FOR ALL TO authenticated
  USING (public.can_manage_team(public.game_team_id(scrim_game_id)))
  WITH CHECK (public.can_manage_team(public.game_team_id(scrim_game_id)));

CREATE POLICY hp_hills_select ON hp_hills FOR SELECT TO authenticated
  USING (public.can_read_team(public.game_team_id(scrim_game_id)));
CREATE POLICY hp_hills_write ON hp_hills FOR ALL TO authenticated
  USING (public.can_manage_team(public.game_team_id(scrim_game_id)))
  WITH CHECK (public.can_manage_team(public.game_team_id(scrim_game_id)));

CREATE POLICY ctrl_rounds_select ON ctrl_rounds FOR SELECT TO authenticated
  USING (public.can_read_team(public.game_team_id(scrim_game_id)));
CREATE POLICY ctrl_rounds_write ON ctrl_rounds FOR ALL TO authenticated
  USING (public.can_manage_team(public.game_team_id(scrim_game_id)))
  WITH CHECK (public.can_manage_team(public.game_team_id(scrim_game_id)));

-- ---------------------------------------------------------------------------
-- Analyst
-- ---------------------------------------------------------------------------

CREATE POLICY weeks_select ON weeks FOR SELECT TO authenticated
  USING (org_id IN (SELECT public.user_org_ids()));
CREATE POLICY weeks_write ON weeks FOR ALL TO authenticated
  USING (public.can_manage_org(org_id)) WITH CHECK (public.can_manage_org(org_id));

CREATE POLICY analyst_assignments_select ON analyst_assignments FOR SELECT TO authenticated
  USING (public.can_read_team(team_id));
-- Analyst yang ditugaskan boleh menandai tugasnya selesai; penugasan dibuat coach.
CREATE POLICY analyst_assignments_insert ON analyst_assignments FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_team(team_id));
CREATE POLICY analyst_assignments_update ON analyst_assignments FOR UPDATE TO authenticated
  USING (public.can_manage_team(team_id) OR analyst_id = auth.uid())
  WITH CHECK (public.can_manage_team(team_id) OR analyst_id = auth.uid());
CREATE POLICY analyst_assignments_delete ON analyst_assignments FOR DELETE TO authenticated
  USING (public.can_manage_team(team_id));

CREATE POLICY player_reviews_select ON player_reviews FOR SELECT TO authenticated
  USING (public.can_read_team(public.player_team_id(player_id)));
CREATE POLICY player_reviews_write ON player_reviews FOR ALL TO authenticated
  USING (
    author_id = auth.uid()
    OR public.can_manage_team(public.player_team_id(player_id))
  )
  WITH CHECK (
    author_id = auth.uid()
    OR public.can_manage_team(public.player_team_id(player_id))
  );

CREATE POLICY weekly_reports_select ON weekly_reports FOR SELECT TO authenticated
  USING (public.can_read_team(team_id));
CREATE POLICY weekly_reports_write ON weekly_reports FOR ALL TO authenticated
  USING (public.can_manage_team(team_id)) WITH CHECK (public.can_manage_team(team_id));
