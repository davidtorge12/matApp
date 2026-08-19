/**
 * Normalises pasted VO lines to the form the matcher expects: `x ` then the
 * work name. Each row is trimmed; an existing marker is kept but collapsed to a
 * single space so "x  name" and "X name" both become "x name".
 */
export function serializeVo(text: string): string {
  return text.replace(/\r\n?/g, "\n").split("\n").map(serializeVoLine).join("\n");
}

function serializeVoLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) {
    return "";
  }

  // Match codes prefixes the SOR code: "P1234 x name". Don't wrap that again.
  const matched = trimmed.match(/^(\S+)\s+[xX]\s+(.*)$/);
  if (matched && !/^[xX]$/.test(matched[1])) {
    return `${matched[1]} x ${matched[2].trim()}`;
  }

  const name = trimmed.replace(/^[xX]\s+/, "").trim();
  return `x ${name}`;
}
