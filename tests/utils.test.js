import { describe, it, expect } from 'vitest';
import U from '../src/utils.js';

describe('parseEntryLine', () => {
  it('procesa códigos simples sin cantidad', () => {
    expect(U.parseEntryLine('12341')).toEqual({ code: '12341', quantity: '1', person: '' });
    expect(U.parseEntryLine('41445')).toEqual({ code: '41445', quantity: '1', person: '' });
  });

  it('procesa códigos con cantidad con o sin espacios', () => {
    expect(U.parseEntryLine('412412-1')).toEqual({ code: '412412', quantity: '1', person: '' });
    expect(U.parseEntryLine('124512 - 3')).toEqual({ code: '124512', quantity: '3', person: '' });
  });

  it('procesa nombres de personas y limpia puntuación accidental', () => {
    expect(U.parseEntryLine('36316-3 Ana')).toEqual({ code: '36316', quantity: '3', person: 'Ana' });
    expect(U.parseEntryLine('5214122- 2 Juan,')).toEqual({ code: '5214122', quantity: '2', person: 'Juan' });
    expect(U.parseEntryLine('35314 -1 Carlos.')).toEqual({ code: '35314', quantity: '1', person: 'Carlos' });
  });

  it('maneja entradas vacías o inválidas de forma segura', () => {
    expect(U.parseEntryLine('')).toEqual({ code: '', quantity: '1', person: '' });
    expect(U.parseEntryLine('   ')).toEqual({ code: '', quantity: '1', person: '' });
  });
});