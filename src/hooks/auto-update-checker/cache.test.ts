import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import * as constants from "./constants"

const TEST_CACHE_DIR = join(import.meta.dir, "__test-cache__")
const TEST_OPENCODE_CACHE_DIR = join(TEST_CACHE_DIR, "opencode")
const TEST_USER_CONFIG_DIR = "/tmp/opencode-config"

mock.module("./constants", () => ({
  ...constants,
  CACHE_DIR: TEST_OPENCODE_CACHE_DIR,
  USER_CONFIG_DIR: TEST_USER_CONFIG_DIR,
  PACKAGE_NAME: "drizzy-agent",
}))

mock.module("../../shared/logger", () => ({
  log: () => {},
}))

function resetTestCache(): void {
  if (existsSync(TEST_CACHE_DIR)) {
    rmSync(TEST_CACHE_DIR, { recursive: true, force: true })
  }

  mkdirSync(join(TEST_OPENCODE_CACHE_DIR, "node_modules", "drizzy-agent"), { recursive: true })
  writeFileSync(
    join(TEST_OPENCODE_CACHE_DIR, "package.json"),
    JSON.stringify({ dependencies: { "drizzy-agent": "latest", other: "1.0.0" } }, null, 2)
  )
  writeFileSync(
    join(TEST_OPENCODE_CACHE_DIR, "bun.lock"),
    JSON.stringify(
      {
        workspaces: {
          "": {
            dependencies: { "drizzy-agent": "latest", other: "1.0.0" },
          },
        },
        packages: {
          "drizzy-agent": {},
          other: {},
        },
      },
      null,
      2
    )
  )
  writeFileSync(
    join(TEST_OPENCODE_CACHE_DIR, "node_modules", "drizzy-agent", "package.json"),
    '{"name":"drizzy-agent"}'
  )
}

describe("invalidatePackage", () => {
  afterAll(() => {
    mock.restore()
  })

  beforeEach(() => {
    resetTestCache()
  })

  afterEach(() => {
    if (existsSync(TEST_CACHE_DIR)) {
      rmSync(TEST_CACHE_DIR, { recursive: true, force: true })
    }
  })

  it("invalidates the installed package from the OpenCode cache directory", async () => {
    const { invalidatePackage } = await import("./cache")

    const result = invalidatePackage()

    expect(result).toBe(true)
    expect(existsSync(join(TEST_OPENCODE_CACHE_DIR, "node_modules", "drizzy-agent"))).toBe(false)

    const packageJson = JSON.parse(readFileSync(join(TEST_OPENCODE_CACHE_DIR, "package.json"), "utf-8")) as {
      dependencies?: Record<string, string>
    }
    expect(packageJson.dependencies?.["drizzy-agent"]).toBe("latest")
    expect(packageJson.dependencies?.other).toBe("1.0.0")

    const bunLock = JSON.parse(readFileSync(join(TEST_OPENCODE_CACHE_DIR, "bun.lock"), "utf-8")) as {
      workspaces?: { ""?: { dependencies?: Record<string, string> } }
      packages?: Record<string, unknown>
    }
    expect(bunLock.workspaces?.[""]?.dependencies?.["drizzy-agent"]).toBe("latest")
    expect(bunLock.workspaces?.[""]?.dependencies?.other).toBe("1.0.0")
    expect(bunLock.packages?.["drizzy-agent"]).toBeUndefined()
    expect(bunLock.packages?.other).toEqual({})
  })
})
