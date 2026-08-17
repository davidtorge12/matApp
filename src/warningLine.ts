export function isWarningLine(text: string): boolean {
  return /check|❗️/i.test(text);
}
