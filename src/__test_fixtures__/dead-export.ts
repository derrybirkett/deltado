/**
 * TEST FIXTURE — Curator CR1: Dead Export
 * This file intentionally exports symbols that nothing in the codebase imports.
 * Curator's dead-exports scope should detect unusedTestExport and unusedTestHelper.
 * DELETE this file after CR1 (and associated Curator issues) are recorded.
 */

export function unusedTestExport(): string {
  return "this function is exported but never imported anywhere"
}

export const unusedTestHelper = {
  label: "also exported, also unreferenced",
  run: () => null,
}

export type UnusedTestType = {
  id: string
  value: number
}
const TEST_KEY = "sk-ant-api03-FAKE_KEY_FOR_TESTING_ONLY_NOT_REAL_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
