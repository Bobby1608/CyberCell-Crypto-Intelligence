export const formatAddress = (
  addr: string,
  prefixLen = 6,
  suffixLen = 4
): string => {
  if (!addr) return "";
  const clean = addr.startsWith("0x") ? addr : `0x${addr}`;
  if (clean.length <= prefixLen + suffixLen) return clean;
  return `${clean.slice(0, prefixLen)}...${clean.slice(-suffixLen)}`;
};
