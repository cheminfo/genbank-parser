import { MONTHS } from './utils/months.ts';

export interface GenbankFeature {
  name: string;
  start: number;
  end: number;
  strand: 1 | -1;
  type: string;
  notes: Record<string, string[]>;
}

export interface GenbankReference {
  description?: string;
  authors?: string;
  consrtm?: string;
  title?: string;
  journal?: string;
  pubmed?: string;
  remark?: string;
}

export interface GenbankResult {
  name: string;
  sequence: string;
  circular: boolean;
  moleculeType: string;
  genbankDivision?: string;
  date: string;
  size: number;
  definition?: string;
  accession?: string;
  version?: string;
  keywords?: string;
  source?: string;
  organism?: string;
  references: GenbankReference[];
  features: GenbankFeature[];
}

interface PartialFeature {
  name?: string;
  start?: number;
  end?: number;
  strand?: 1 | -1;
  type?: string;
  notes: Record<string, Array<string | number>>;
}

interface PartialResult {
  features: PartialFeature[];
  name: string;
  sequence: string;
  references: GenbankReference[];
  circular?: boolean;
  moleculeType?: string;
  genbankDivision?: string;
  date?: string;
  size?: number;
  [key: string]: unknown;
}

const LOCUS_TAG = 'LOCUS';
const DEFINITION_TAG = 'DEFINITION';
const ACCESSION_TAG = 'ACCESSION';
const VERSION_TAG = 'VERSION';
const KEYWORDS_TAG = 'KEYWORDS';
const SOURCE_TAG = 'SOURCE';
const ORGANISM_TAG = 'ORGANISM';
const REFERENCE_TAG = 'REFERENCE';
const FEATURES_TAG = 'FEATURES';
const ORIGIN_TAG = 'ORIGIN';
const END_SEQUENCE_TAG = '//';

const LOCUS_REGEX =
  /^(?<locusName>\S+)\s+(?<size>\d+)\s+bp\s+(?<moleculeType>\S+)\s+(?<topology>\S+)\s+(?<field5>\S+)\s*(?<field6>\S+)?$/;

const DATE_REGEX = /^(?<day>\d{2})-(?<month>.{3})-(?<year>\d{4})$/;

/**
 * Parse a genbank formatted string into an array of parsed genbank records.
 * @param sequence - The genbank formatted string to parse.
 * @returns An array of parsed genbank records.
 */
export function genbankToJson(sequence: string): GenbankResult[] {
  if (typeof sequence !== 'string') {
    throw new TypeError('input must be a string');
  }

  const resultsArray: GenbankResult[] = [];
  let result: PartialResult | undefined;
  let currentFeatureNote: Array<string | number> | undefined;

  const lines = sequence.split(/\r?\n/);
  let fieldName: string | undefined;
  let subFieldType: string | undefined;
  let featureLocationIndentation = 0;
  let lastLineWasFeaturesTag = false;
  let lastLineWasLocation = false;

  let hasFoundLocus = false;

  for (const line of lines) {
    const lineFieldName = getLineFieldName(line);
    const val = getLineVal(line);
    const isSubKey = isSubKeyword(line);
    const isKey = isKeyword(line);

    if (lineFieldName === END_SEQUENCE_TAG || isKey) {
      fieldName = lineFieldName;
      subFieldType = undefined;
    } else if (isSubKey) {
      subFieldType = lineFieldName;
    }

    if (line.trim() === '' || lineFieldName === ';') {
      continue;
    }

    if (!hasFoundLocus && fieldName !== LOCUS_TAG) {
      break;
    }

    if (fieldName === LOCUS_TAG) {
      hasFoundLocus = true;
      parseLocus(line);
    } else if (fieldName === FEATURES_TAG) {
      parseFeatures(line, lineFieldName, val);
    } else if (fieldName === ORIGIN_TAG) {
      parseOrigin(line, lineFieldName);
    } else if (
      fieldName === DEFINITION_TAG ||
      fieldName === ACCESSION_TAG ||
      fieldName === VERSION_TAG ||
      fieldName === KEYWORDS_TAG
    ) {
      parseMultiLineField(fieldName, line, fieldName.toLowerCase());
    } else if (fieldName === SOURCE_TAG) {
      if (subFieldType === ORGANISM_TAG) {
        parseMultiLineField(subFieldType, line, 'organism');
      } else {
        parseMultiLineField(lineFieldName, line, 'source');
      }
    } else if (fieldName === REFERENCE_TAG) {
      if (result && lineFieldName === REFERENCE_TAG) {
        result.references.push({});
      }
      parseReference(line, subFieldType);
    } else if (fieldName === END_SEQUENCE_TAG) {
      endSeq();
    }
  }

  if (result && resultsArray.at(-1) !== (result as unknown)) {
    endSeq();
  }
  return resultsArray;

  function endSeq() {
    if (!result) return;
    postProcessCurrentSequence();
    resultsArray.push(result as unknown as GenbankResult);
  }

  function getCurrentFeature(): PartialFeature | undefined {
    if (!result) return undefined;
    return result.features.at(-1);
  }

  function postProcessCurrentSequence() {
    if (!result?.features) return;
    for (let i = 0; i < result.features.length; i++) {
      const feature = result.features[i];
      if (feature) {
        result.features[i] = postProcessGenbankFeature(feature);
      }
    }
  }

  function parseOrigin(line: string, key: string) {
    if (key !== ORIGIN_TAG && result) {
      const newLine = line.replaceAll(/\s*\d*/g, '');
      result.sequence += newLine;
    }
  }

  function parseLocus(line: string) {
    result = {
      features: [],
      name: 'Untitled sequence',
      sequence: '',
      references: [],
    };
    line = removeFieldName(LOCUS_TAG, line);
    const match = LOCUS_REGEX.exec(line);
    if (!match?.groups) return;
    const { locusName, size, moleculeType, topology, field5, field6 } =
      match.groups;
    if (!locusName || !moleculeType) return;
    let dateString = '';
    if (!field6) {
      dateString = field5 ?? '';
    } else {
      result.genbankDivision = field5;
      dateString = field6;
    }
    result.circular = topology === 'circular';
    result.moleculeType = moleculeType;
    const dateMatch = DATE_REGEX.exec(dateString);
    if (dateMatch?.groups) {
      const { day, month, year } = dateMatch.groups;
      if (day && month && year) {
        const date = new Date();
        date.setFullYear(Number(year));
        date.setUTCMonth(MONTHS.indexOf(month.toUpperCase()));
        date.setDate(Number(day));
        date.setUTCHours(12);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        result.date = date.toISOString();
      }
    }
    result.name = locusName;
    result.size = Number(size);
  }

  function parseReference(line: string, subType: string | undefined) {
    if (!result) return;
    const references = result.references;
    const lastReference = references.at(-1);
    if (!lastReference) return;
    if (!subType) {
      parseMultiLineField(
        REFERENCE_TAG,
        line,
        'description',
        lastReference as Record<string, string>,
      );
    } else {
      parseMultiLineField(
        subType,
        line,
        subType.toLowerCase(),
        lastReference as Record<string, string>,
      );
    }
  }

  function parseFeatures(line: string, key: string, val: string) {
    let strand: 1 | -1;
    if (key === FEATURES_TAG) {
      lastLineWasFeaturesTag = true;
      return;
    }

    if (lastLineWasFeaturesTag) {
      featureLocationIndentation =
        getLengthOfWhiteSpaceBeforeStartOfLetters(line);
      lastLineWasFeaturesTag = false;
    }

    if (isFeatureLineRunon(line, featureLocationIndentation)) {
      if (lastLineWasLocation) {
        parseFeatureLocation(line.trim());
        lastLineWasLocation = true;
      } else {
        if (currentFeatureNote) {
          const lastIndex = currentFeatureNote.length - 1;
          const lastValue = currentFeatureNote[lastIndex];
          currentFeatureNote[lastIndex] =
            String(lastValue) + line.trim().replaceAll('"', '');
        }
        lastLineWasLocation = false;
      }
    } else if (isNote(line)) {
      if (getCurrentFeature()) {
        parseFeatureNote(line);
        lastLineWasLocation = false;
      }
    } else {
      if (val.match(/complement/g)) {
        strand = -1;
      } else {
        strand = 1;
      }

      newFeature();
      const feature = getCurrentFeature();
      if (feature) {
        feature.type = key;
        feature.strand = strand;
      }

      parseFeatureLocation(val);
      lastLineWasLocation = true;
    }
  }

  function newFeature() {
    if (!result) return;
    result.features.push({
      notes: {},
    });
  }

  function parseFeatureLocation(locationString: string) {
    locationString = locationString.trim();
    const locationArray: string[] = [];
    // eslint-disable-next-line prefer-named-capture-group
    locationString.replaceAll(/(\d+)/g, (_string, match: string) => {
      locationArray.push(match);
      return match;
    });
    const feature = getCurrentFeature();
    if (!feature) return;
    feature.start = Number(locationArray[0]);
    feature.end =
      locationArray[1] === undefined
        ? Number(locationArray[0])
        : Number(locationArray[1]);
  }

  function parseFeatureNote(line: string) {
    let newLine = line.trim();
    newLine = newLine.replaceAll(/^\/|"$/g, '');
    const lineArray = newLine.split(/[=]"|=/);

    let val: string | number | undefined = lineArray[1];

    if (val) {
      val = val.replaceAll('\\', ' ');

      if (line.match(/[=]"/g)) {
        val = val.replaceAll(/".*/g, '');
      } else if (/^\d+$/.test(val)) {
        val = Number(val);
      }
    }
    const key = lineArray[0];
    if (!key) return;
    const feature = getCurrentFeature();
    if (!feature) return;
    const currentNotes = feature.notes;
    if (currentNotes[key]) {
      currentNotes[key].push(val as string | number);
    } else {
      currentNotes[key] = [val as string | number];
    }
    currentFeatureNote = currentNotes[key];
  }

  function parseMultiLineField(
    fieldNameToRemove: string,
    line: string,
    resultKey: string,
    target?: Record<string, string>,
  ) {
    const record = target ?? (result as unknown as Record<string, string>);
    const fieldValue = removeFieldName(fieldNameToRemove, line);
    record[resultKey] = record[resultKey] ? `${record[resultKey]} ` : '';
    record[resultKey] += fieldValue;
  }
}

function removeFieldName(fieldNameToRemove: string, line: string): string {
  line = line.replace(/^\s*/, '');
  if (line.startsWith(fieldNameToRemove)) {
    line = line.replace(fieldNameToRemove, '');
  }
  return line.trim();
}

function isNote(line: string): boolean {
  if (line.trim().startsWith('/')) {
    return true;
  }
  if (/^\s*\/\w+=\S+/.test(line)) {
    return true;
  }
  return false;
}

function getLineFieldName(line: string): string {
  line = line.trim();
  const array = line.split(/\s+/);
  return array[0] ?? '';
}

function getLineVal(line: string): string {
  if (!line.includes('=')) {
    line = line.replace(/^\s*\S+\s+|\s+$/, '');
    line = line.trim();
    return line;
  } else {
    const array = line.split(/[=]/);
    return array[1] ?? '';
  }
}

function isKeyword(line: string): boolean {
  return /^\S+/.test(line.slice(0, 10));
}

function isSubKeyword(line: string): boolean {
  return /^\s+\S+/.test(line.slice(0, 10));
}

function postProcessGenbankFeature(feature: PartialFeature): PartialFeature {
  if (feature.notes.label) {
    feature.name = String(feature.notes.label[0]);
  } else if (feature.notes.gene) {
    feature.name = String(feature.notes.gene[0]);
  } else if (feature.notes.ApEinfo_label) {
    feature.name = String(feature.notes.ApEinfo_label[0]);
  } else if (feature.notes.name) {
    feature.name = String(feature.notes.name[0]);
  } else if (feature.notes.organism) {
    feature.name = String(feature.notes.organism[0]);
  } else if (feature.notes.locus_tag) {
    feature.name = String(feature.notes.locus_tag[0]);
  } else if (feature.notes.note) {
    feature.name = String(feature.notes.note[0]);
  } else {
    feature.name = 'Untitled Feature';
  }
  return feature;
}

function isFeatureLineRunon(
  line: string,
  featureLocationIndentation: number,
): boolean {
  const indentationOfLine = getLengthOfWhiteSpaceBeforeStartOfLetters(line);
  if (featureLocationIndentation === indentationOfLine) {
    return false;
  }

  const trimmed = line.trim();
  if (trimmed.startsWith('/')) {
    return false;
  }
  return true;
}

function getLengthOfWhiteSpaceBeforeStartOfLetters(value: string): number {
  const match = /^\s*/.exec(value);
  if (match !== null) {
    return match[0].length;
  }
  return 0;
}
