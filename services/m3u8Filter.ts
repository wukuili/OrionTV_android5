import Logger from '@/utils/Logger';

const logger = Logger.withTag('M3U8Filter');

const AD_KEYWORDS = [
  'sponsor',
  '/ad/',
  '/ads/',
  'advert',
  'advertisement',
  '/adjump',
  'redtraffic',
  '/ad.',
  '/ads.',
  'preroll',
  'midroll',
  'postroll',
  'doubleclick',
  'googlesyndication',
];

export function filterAdsFromM3U8(source: string, m3u8Content: string): string {
  if (!m3u8Content) return '';

  const isMasterPlaylist = m3u8Content.includes('#EXT-X-STREAM-INF');

  if (isMasterPlaylist) {
    return filterAdsFromMasterPlaylist(source, m3u8Content);
  } else {
    return filterAdsFromMediaPlaylist(source, m3u8Content);
  }
}

function filterAdsFromMasterPlaylist(source: string, m3u8Content: string): string {
  const lines = m3u8Content.split('\n');
  const filteredLines: string[] = [];
  let skipNext = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      if (containsAdKeyword(nextLine)) {
        skipNext = true;
        continue;
      }
      filteredLines.push(line);
    } else if (skipNext) {
      skipNext = false;
    } else if (!line.startsWith('#EXT-X-STREAM-INF:') && line.trim() !== '') {
      if (!line.startsWith('#') || line === '#EXTM3U') {
        if (!containsAdKeyword(line)) {
          filteredLines.push(line);
        }
      } else {
        filteredLines.push(line);
      }
    } else if (line.trim() === '') {
      filteredLines.push(line);
    }
  }

  return filteredLines.join('\n');
}

function filterAdsFromMediaPlaylist(source: string, m3u8Content: string): string {
  const lines = m3u8Content.split('\n');
  const filteredLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.includes('#EXT-X-DISCONTINUITY')) {
      i++;
      continue;
    }

    if (line.includes('#EXT-X-CUE-OUT') || line.includes('#EXT-X-CUE-IN')) {
      i++;
      continue;
    }

    if (line.match(/^#EXT-X-DATERANGE:.*CLASS="com\.apple\.streamingkit\.ad/prespawn"/i)) {
      while (i < lines.length && !lines[i].startsWith('#EXTINF:')) {
        i++;
      }
      if (i < lines.length && lines[i].startsWith('#EXTINF:')) {
        i++;
        if (i < lines.length) {
          i++;
        }
      }
      continue;
    }

    if (line.match(/^#EXT-X-SCTE35:.*CUE-OUT/i)) {
      let segmentCount = 0;
      const durationMatch = line.match(/CUE-OUT[:=](\d+(\.\d+)?)/i) ||
                             line.match(/DURATION=(\d+(\.\d+)?)/i);
      if (durationMatch) {
        const adDuration = parseFloat(durationMatch[1]);
        let j = i + 1;
        let accumulatedDuration = 0;
        while (j < lines.length && accumulatedDuration < adDuration) {
          if (lines[j].startsWith('#EXTINF:')) {
            const extinfDuration = parseFloat(lines[j].substring(8).split(',')[0]) || 0;
            accumulatedDuration += extinfDuration;
            segmentCount++;
          }
          j++;
        }
      }
      i++;
      continue;
    }

    if (line.match(/^#EXT-X-SCTE35:.*CUE-IN/i)) {
      i++;
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (containsAdKeyword(nextLine)) {
          i += 2;
          continue;
        }
      }
      filteredLines.push(line);
      i++;
      if (i < lines.length && !lines[i].startsWith('#')) {
        filteredLines.push(lines[i]);
      }
      i++;
      continue;
    }

    filteredLines.push(line);
    i++;
  }

  let result = filteredLines.join('\n');
  result = removeDiscontinuityGaps(result);

  const originalDuration = getTotalDuration(m3u8Content);
  const filteredDuration = getTotalDuration(result);
  if (originalDuration > 0 && (originalDuration - filteredDuration) / originalDuration > 0.5) {
    logger.warn(`[AD_FILTER] Filtered too much content (${originalDuration}s -> ${filteredDuration}s), falling back to original`);
    return m3u8Content;
  }

  return result;
}

function containsAdKeyword(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return AD_KEYWORDS.some(keyword => lowerUrl.includes(keyword.toLowerCase()));
}

function removeDiscontinuityGaps(m3u8Content: string): string {
  const lines = m3u8Content.split('\n');
  const filteredLines: string[] = [];
  let prevLineIsTag = false;

  for (const line of lines) {
    if (line.trim() === '') {
      continue;
    }

    if (!line.startsWith('#') && prevLineIsTag) {
      prevLineIsTag = false;
      filteredLines.push(line);
      continue;
    }

    if (!line.startsWith('#')) {
      filteredLines.push(line);
      prevLineIsTag = false;
      continue;
    }

    if (line.startsWith('#EXTINF:') || line.startsWith('#EXT-X-KEY:') || line.startsWith('#EXT-X-MAP:')) {
      filteredLines.push(line);
      prevLineIsTag = true;
    } else {
      filteredLines.push(line);
      prevLineIsTag = false;
    }
  }

  return filteredLines.join('\n');
}

function getTotalDuration(m3u8Content: string): number {
  let totalDuration = 0;
  const lines = m3u8Content.split('\n');
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const durationMatch = line.match(/#EXTINF:([\d.]+)/);
      if (durationMatch) {
        totalDuration += parseFloat(durationMatch[1]);
      }
    }
  }
  return totalDuration;
}

export function isM3U8Url(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.m3u8') || lowerUrl.includes('.m3u8?') || lowerUrl.includes('.m3u8#');
}

export async function getFilteredM3U8Url(
  originalUrl: string,
  source: string,
  apiBaseUrl: string
): Promise<string> {
  if (!apiBaseUrl || !isM3U8Url(originalUrl)) {
    return originalUrl;
  }

  const proxyUrl = `${apiBaseUrl}/api/proxy-m3u8?url=${encodeURIComponent(originalUrl)}&source=${encodeURIComponent(source)}`;
  return proxyUrl;
}