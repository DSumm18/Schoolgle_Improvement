import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { assertSafeDatabaseEnvironment } from "./database-environment";

const originalEnv = { ...process.env };

describe("database environment safety guard", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SCHOOLGLE_DB_ENV;
    delete process.env.NEXT_PUBLIC_SCHOOLGLE_DB_ENV;
    delete process.env.SCHOOLGLE_DEPLOY_ENV;
    delete process.env.VERCEL_ENV;
    delete process.env.SCHOOLGLE_ALLOW_PRODUCTION_DB_FROM_LOCAL;
    delete process.env.SUPABASE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("allows local Supabase URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";

    expect(() => assertSafeDatabaseEnvironment("test access")).not.toThrow();
  });

  it("allows explicitly labelled UAT remote Supabase URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://uat-ref.supabase.co";
    process.env.SCHOOLGLE_DB_ENV = "uat";

    expect(() => assertSafeDatabaseEnvironment("test access")).not.toThrow();
  });

  it("blocks unlabelled remote Supabase URLs during local/test access", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://live-ref.supabase.co";

    expect(() => assertSafeDatabaseEnvironment("test access")).toThrow(/Refusing test access/);
  });

  it("blocks remote Supabase URLs labelled as local", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://live-ref.supabase.co";
    process.env.SCHOOLGLE_DB_ENV = "local";

    expect(() => assertSafeDatabaseEnvironment("test access")).toThrow(/SCHOOLGLE_DB_ENV is set to "local"/);
  });

  it("allows explicit production deployments", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://live-ref.supabase.co";
    process.env.VERCEL_ENV = "production";

    expect(() => assertSafeDatabaseEnvironment("test access")).not.toThrow();
  });
});
