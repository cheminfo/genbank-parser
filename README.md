# genbank-parser

[![NPM version][npm-image]][npm-url]
[![build status][ci-image]][ci-url]
[![npm download][download-image]][download-url]

This work was based on [TeselaGen/ve-sequence-parsers](https://github.com/TeselaGen/ve-sequence-parsers).

Parse genbank files.

## Installation

```console
npm install genbank-parser
```

## Usage

```ts
import { readFileSync } from 'node:fs';

import { genbankToJson } from 'genbank-parser';

const genbank = readFileSync('./genbank.gb', 'utf-8');
const result = genbankToJson(genbank);
```

## Parsed fields

The parser tries to parse all fields described by the [genbank documentation](https://www.ncbi.nlm.nih.gov/Sitemap/samplerecord.html).

Additional properties are added:

At the sequence level:

- `name`: locus name

At the feature level:

- `name`: extracted from several possible feature notes. Default is `/label`

## Example

Input genbank

```txt
LOCUS       Z78533                   740 bp    DNA     linear   PLN 30-NOV-2006
DEFINITION  C.irapeanum 5.8S rRNA gene and ITS1 and ITS2 DNA.
ACCESSION   Z78533
VERSION     Z78533.1  GI:2765658
KEYWORDS    5.8S ribosomal RNA; 5.8S rRNA gene; internal transcribed spacer;
            ITS1; ITS2.
SOURCE      Cypripedium irapeanum
  ORGANISM  Cypripedium irapeanum
            Eukaryota; Viridiplantae; Streptophyta; Embryophyta; Tracheophyta;
            Spermatophyta; Magnoliophyta; Liliopsida; Asparagales; Orchidaceae;
            Cypripedioideae; Cypripedium.
REFERENCE   1
  AUTHORS   Cox,A.V., Pridgeon,A.M., Albert,V.A. and Chase,M.W.
  TITLE     Phylogenetics of the slipper orchids (Cypripedioideae:
            Orchidaceae): nuclear rDNA ITS sequences
  JOURNAL   Unpublished
REFERENCE   2  (bases 1 to 740)
  AUTHORS   Cox,A.V.
  TITLE     Direct Submission
  JOURNAL   Submitted (19-AUG-1996) Cox A.V., Royal Botanic Gardens, Kew,
            Richmond, Surrey TW9 3AB, UK
FEATURES             Location/Qualifiers
     source          1..740
                     /organism="Cypripedium irapeanum"
                     /mol_type="genomic DNA"
                     /db_xref="taxon:49711"
     misc_feature    1..380
                     /note="internal transcribed spacer 1"
     gene            381..550
                     /gene="5.8S rRNA"
     rRNA            381..550
                     /gene="5.8S rRNA"
                     /product="5.8S ribosomal RNA"
     misc_feature    551..740
                     /note="internal transcribed spacer 2"
ORIGIN
        1 cgtaacaagg tttccgtagg tgaacctgcg gaaggatcat tgatgagacc gtggaataaa
       61 cgatcgagtg aatccggagg accggtgtac tcagctcacc gggggcattg ctcccgtggt
      121 gaccctgatt tgttgttggg ccgcctcggg agcgtccatg gcgggtttga acctctagcc
      181 cggcgcagtt tgggcgccaa gccatatgaa agcatcaccg gcgaatggca ttgtcttccc
      241 caaaacccgg agcggcggcg tgctgtcgcg tgcccaatga attttgatga ctctcgcaaa
      301 cgggaatctt ggctctttgc atcggatgga aggacgcagc gaaatgcgat aagtggtgtg
      361 aattgcaaga tcccgtgaac catcgagtct tttgaacgca agttgcgccc gaggccatca
      421 ggctaagggc acgcctgctt gggcgtcgcg cttcgtctct ctcctgccaa tgcttgcccg
      481 gcatacagcc aggccggcgt ggtgcggatg tgaaagattg gccccttgtg cctaggtgcg
      541 gcgggtccaa gagctggtgt tttgatggcc cggaacccgg caagaggtgg acggatgctg
      601 gcagcagctg ccgtgcgaat cccccatgtt gtcgtgcttg tcggacaggc aggagaaccc
      661 ttccgaaccc caatggaggg cggttgaccg ccattcggat gtgaccccag gtcaggcggg
      721 ggcacccgct gagtttacgc
//
```

Parsed output

```js
[
  {
    features: [
      {
        notes: {
          organism: ['Cypripedium irapeanum'],
          mol_type: ['genomic DNA'],
          db_xref: ['taxon:49711'],
        },
        type: 'source',
        strand: 1,
        start: 1,
        end: 740,
        name: 'Cypripedium irapeanum',
      },
      {
        notes: { note: ['internal transcribed spacer 1'] },
        type: 'misc_feature',
        strand: 1,
        start: 1,
        end: 380,
        name: 'internal transcribed spacer 1',
      },
      {
        notes: { gene: ['5.8S rRNA'] },
        type: 'gene',
        strand: 1,
        start: 381,
        end: 550,
        name: '5.8S rRNA',
      },
      {
        notes: { gene: ['5.8S rRNA'], product: ['5.8S ribosomal RNA'] },
        type: 'rRNA',
        strand: 1,
        start: 381,
        end: 550,
        name: '5.8S rRNA',
      },
      {
        notes: { note: ['internal transcribed spacer 2'] },
        type: 'misc_feature',
        strand: 1,
        start: 551,
        end: 740,
        name: 'internal transcribed spacer 2',
      },
    ],
    name: 'Z78533',
    sequence:
      'cgtaacaaggtttccgtaggtgaacctgcggaaggatcattgatgagaccgtggaataaacgatcgagtgaatccggaggaccggtgtactcagctcaccgggggcattgctcccgtggtgaccctgatttgttgttgggccgcctcgggagcgtccatggcgggtttgaacctctagcccggcgcagtttgggcgccaagccatatgaaagcatcaccggcgaatggcattgtcttccccaaaacccggagcggcggcgtgctgtcgcgtgcccaatgaattttgatgactctcgcaaacgggaatcttggctctttgcatcggatggaaggacgcagcgaaatgcgataagtggtgtgaattgcaagatcccgtgaaccatcgagtcttttgaacgcaagttgcgcccgaggccatcaggctaagggcacgcctgcttgggcgtcgcgcttcgtctctctcctgccaatgcttgcccggcatacagccaggccggcgtggtgcggatgtgaaagattggccccttgtgcctaggtgcggcgggtccaagagctggtgttttgatggcccggaacccggcaagaggtggacggatgctggcagcagctgccgtgcgaatcccccatgttgtcgtgcttgtcggacaggcaggagaacccttccgaaccccaatggagggcggttgaccgccattcggatgtgaccccaggtcaggcgggggcacccgctgagtttacgc',
    circular: false,
    moleculeType: 'DNA',
    genbankDivision: 'PLN',
    date: '2006-11-30T12:00:00.000Z',
    size: 740,
    definition: 'C.irapeanum 5.8S rRNA gene and ITS1 and ITS2 DNA.',
    accession: 'Z78533',
    version: 'Z78533.1  GI:2765658',
    keywords:
      '5.8S ribosomal RNA; 5.8S rRNA gene; internal transcribed spacer; ITS1; ITS2.',
    source: 'Cypripedium irapeanum',
    organism:
      'Cypripedium irapeanum Eukaryota; Viridiplantae; Streptophyta; Embryophyta; Tracheophyta; Spermatophyta; Magnoliophyta; Liliopsida; Asparagales; Orchidaceae; Cypripedioideae; Cypripedium.',
    references: [
      {
        description: '1',
        authors: 'Cox,A.V., Pridgeon,A.M., Albert,V.A. and Chase,M.W.',
        title:
          'Phylogenetics of the slipper orchids (Cypripedioideae: Orchidaceae): nuclear rDNA ITS sequences',
        journal: 'Unpublished',
      },
      {
        description: '2  (bases 1 to 740)',
        authors: 'Cox,A.V.',
        title: 'Direct Submission',
        journal:
          'Submitted (19-AUG-1996) Cox A.V., Royal Botanic Gardens, Kew, Richmond, Surrey TW9 3AB, UK',
      },
    ],
  },
];
```

## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/genbank-parser.svg
[npm-url]: https://www.npmjs.com/package/genbank-parser
[ci-image]: https://github.com/cheminfo/genbank-parser/workflows/Node.js%20CI/badge.svg?branch=main
[ci-url]: https://github.com/cheminfo/genbank-parser/actions?query=workflow%3A%22Node.js+CI%22
[download-image]: https://img.shields.io/npm/dm/genbank-parser.svg
[download-url]: https://www.npmjs.com/package/genbank-parser
