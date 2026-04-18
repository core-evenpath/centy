import { describe, expect, it } from 'vitest';
import { importModuleItemsFromCSV } from '../module-csv-import';
import type { ModuleFieldDefinition } from '@/lib/modules/types';

const ROOM_SCHEMA: { fields: ModuleFieldDefinition[] } = {
  fields: [
    {
      id: 'bed_type',
      name: 'Bed Type',
      type: 'select',
      description: '',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      options: ['Single', 'Double', 'Queen', 'King', 'Twin'],
      order: 1,
    },
    {
      id: 'max_occupancy',
      name: 'Max Occupancy',
      type: 'number',
      description: '',
      isRequired: true,
      isSearchable: false,
      showInList: true,
      showInCard: false,
      validation: { min: 1, max: 10 },
      order: 2,
    },
    {
      id: 'room_size',
      name: 'Room Size',
      type: 'number',
      description: '',
      isRequired: false,
      isSearchable: false,
      showInList: false,
      showInCard: false,
      order: 3,
    },
    {
      id: 'is_smoking',
      name: 'Smoking Allowed',
      type: 'toggle',
      description: '',
      isRequired: false,
      isSearchable: false,
      showInList: false,
      showInCard: false,
      order: 4,
    },
    {
      id: 'amenities',
      name: 'Amenities',
      type: 'multi_select',
      description: '',
      isRequired: false,
      isSearchable: false,
      showInList: false,
      showInCard: false,
      options: ['AC', 'WiFi', 'TV'],
      order: 5,
    },
  ],
};

describe('importModuleItemsFromCSV', () => {
  it('parses a clean CSV with headers matching field ids', () => {
    const csv = `name,bed_type,max_occupancy,room_size
Standard Room,Queen,2,220
Deluxe Room,King,2,320`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.total).toBe(2);
    expect(result.valid.length).toBe(2);
    expect(result.invalid.length).toBe(0);
    expect(result.valid[0].name).toBe('Standard Room');
    expect(result.valid[0].fields.bed_type).toBe('Queen');
    expect(result.valid[0].fields.max_occupancy).toBe(2);
  });

  it('maps headers by field name (case-insensitive) when id is not a direct match', () => {
    const csv = `Name,Bed Type,Max Occupancy
Standard,Queen,2`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.valid.length).toBe(1);
    expect(result.valid[0].fields.bed_type).toBe('Queen');
  });

  it('handles BOM + quoted fields + CRLF', () => {
    const csv = '\ufeff"name","bed_type","max_occupancy"\r\n"Room, The","Queen","2"\r\n';
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.valid.length).toBe(1);
    expect(result.valid[0].name).toBe('Room, The');
  });

  it('coerces multi_select via , | ; delimiters', () => {
    const csv = `name,bed_type,max_occupancy,amenities
Room,King,2,"AC, WiFi, TV"`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.valid[0].fields.amenities).toEqual(['AC', 'WiFi', 'TV']);
  });

  it('coerces toggle from true/yes/1 and false/no/0', () => {
    const csv = `name,bed_type,max_occupancy,is_smoking
A,King,2,yes
B,King,2,no
C,King,2,true
D,King,2,false`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.valid.map((r) => r.fields.is_smoking)).toEqual([true, false, true, false]);
  });

  it('flags rows missing required name', () => {
    const csv = `name,bed_type,max_occupancy
,Queen,2`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.invalid.length).toBe(1);
    expect(result.invalid[0].errors.some((e) => /name/i.test(e))).toBe(true);
  });

  it('flags rows missing required schema field', () => {
    const csv = `name,max_occupancy
Missing bed type,2`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.invalid.length).toBe(1);
    expect(result.invalid[0].errors.some((e) => /bed type/i.test(e))).toBe(true);
  });

  it('flags invalid select option', () => {
    const csv = `name,bed_type,max_occupancy
Room,Waterbed,2`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.invalid.length).toBe(1);
    expect(result.invalid[0].errors.some((e) => /invalid option/i.test(e))).toBe(true);
  });

  it('flags number below minimum', () => {
    const csv = `name,bed_type,max_occupancy
Room,Queen,0`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.invalid.length).toBe(1);
    expect(result.invalid[0].errors.some((e) => /minimum/i.test(e))).toBe(true);
  });

  it('headerMap surfaces which columns mapped and which were dropped', () => {
    const csv = `name,bed_type,max_occupancy,ignored_column
Room,Queen,2,whatever`;
    const result = importModuleItemsFromCSV(csv, ROOM_SCHEMA);
    expect(result.headers).toEqual(['name', 'bed_type', 'max_occupancy', 'ignored_column']);
    expect(Object.keys(result.headerMap).sort()).toEqual(['bed_type', 'max_occupancy', 'name'].sort());
  });
});
