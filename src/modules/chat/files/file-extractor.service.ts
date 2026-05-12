import { Injectable, Logger, BadRequestException } from '@nestjs/common';

// pdf-parse v2: use the underlying lib file directly to skip the debug-mode bootstrap
// that tries to read its own test PDF when imported in some bundlings.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse/lib/pdf-parse.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mammoth = require('mammoth');

export interface ExtractedFile {
  name: string;
  size: number;
  text: string;
  truncated: boolean;
}

const MAX_PER_FILE_CHARS = 100_000;
const MAX_TOTAL_CHARS = 500_000;

@Injectable()
export class FileExtractorService {
  private readonly logger = new Logger(FileExtractorService.name);

  /**
   * Aceita os arquivos vindos do multer (Express.Multer.File) e retorna texto extraido.
   * Tipos suportados: .md .txt .json .csv .pdf .docx
   * Outros tipos: ignorados com warning.
   */
  async extractAll(
    files: Array<{ originalname: string; mimetype: string; size: number; buffer: Buffer }>,
  ): Promise<{ files: ExtractedFile[]; totalChars: number }> {
    const out: ExtractedFile[] = [];
    let totalChars = 0;

    for (const f of files) {
      if (totalChars >= MAX_TOTAL_CHARS) {
        this.logger.warn(`Limite de ${MAX_TOTAL_CHARS} chars atingido, ignorando "${f.originalname}"`);
        break;
      }
      try {
        const text = await this.extractOne(f);
        const truncated = text.length > MAX_PER_FILE_CHARS;
        const sliced = truncated ? text.slice(0, MAX_PER_FILE_CHARS) : text;
        out.push({
          name: f.originalname,
          size: f.size,
          text: sliced,
          truncated,
        });
        totalChars += sliced.length;
      } catch (err) {
        this.logger.warn(`Falha extraindo "${f.originalname}": ${(err as Error).message}`);
        // continue with remaining files
      }
    }

    return { files: out, totalChars };
  }

  private async extractOne(
    f: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<string> {
    const lower = f.originalname.toLowerCase();
    if (
      lower.endsWith('.md') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.json') ||
      lower.endsWith('.csv') ||
      f.mimetype.startsWith('text/')
    ) {
      return f.buffer.toString('utf-8');
    }
    if (lower.endsWith('.pdf') || f.mimetype === 'application/pdf') {
      const result = await pdfParse(f.buffer);
      return result.text;
    }
    if (
      lower.endsWith('.docx') ||
      f.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: f.buffer });
      return result.value;
    }
    throw new BadRequestException(
      `Tipo de arquivo nao suportado: ${f.originalname} (use .md, .txt, .json, .csv, .pdf, .docx)`,
    );
  }

  /** Formata os arquivos extraidos como contexto pro LLM. */
  formatForPrompt(files: ExtractedFile[]): string {
    if (files.length === 0) return '';
    return files
      .map((f) => {
        const header = `=== ARQUIVO: ${f.name} ===`;
        const footer = f.truncated ? `\n[truncado em ${MAX_PER_FILE_CHARS} chars]` : '';
        return `${header}\n${f.text}${footer}`;
      })
      .join('\n\n');
  }
}
