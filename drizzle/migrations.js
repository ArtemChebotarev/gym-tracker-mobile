// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_initial_schema.sql';
import m0001 from './0001_seed_catalog.sql';
import m0002 from './0002_mesocycle_archived_at.sql';
import m0003 from './0003_onboarding_flags.sql';
import m0004 from './0004_template_description.sql';
import m0005 from './0005_seed_catalog_templates.sql';
import m0006 from './0006_hybrid_exercise_types.sql';
import m0007 from './0007_settings_get_ready.sql';
import m0008 from './0008_settings_signals.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006,
m0007,
m0008
    }
  }
  