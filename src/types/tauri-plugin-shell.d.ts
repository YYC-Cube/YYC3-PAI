/**
 * @file tauri-plugin-shell.d.ts
 * @description YYC³ AI-PAI type definitions and examples
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [types]
 */

declare module '@tauri-apps/plugin-shell' {
  interface CommandResult {
    code: number | null
    stdout: string
    stderr: string
  }

  class Command {
    constructor(program: string, args?: string[])
    execute(): Promise<CommandResult>
  }
}
