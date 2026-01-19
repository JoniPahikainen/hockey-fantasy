import fs from 'fs';
import path from 'path';

export class Logger {
  private startTime: number;
  private totalItems: number;
  private processedItems: number = 0;
  private logFilePath: string;

  constructor(private context: string, total: number = 0) {
    this.startTime = Date.now();
    this.totalItems = total;

    const logDir = path.join(process.cwd(), 'storage', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    this.logFilePath = path.join(logDir, `sync_${dateStr}.log`);
  }

  log(level: 'INFO' | 'WARN' | 'ERROR', message: string, metadata?: any) {
    const timestamp = new Date().toISOString();
    const metaString = metadata ? ` | DATA: ${JSON.stringify(metadata)}` : '';
    const fullMessage = `[${timestamp}] [${level}] [${this.context}] ${message}${metaString}`;

    console.log(fullMessage);

    fs.appendFileSync(this.logFilePath, fullMessage + '\n');
  }

  progress(identifier: string | number, increment: number = 1) {
    if (typeof identifier === 'number') {
      this.processedItems = identifier;
    } else {
      this.processedItems += increment;
    }

    const elapsedMs = Date.now() - this.startTime;
    const safeElapsed = elapsedMs > 0 ? elapsedMs : 1;
    const itemsPerSecond = (this.processedItems / (safeElapsed / 1000)).toFixed(2);
    
    let etr = "CALC...";
    if (this.totalItems > 0 && this.processedItems > 0) {
      const remaining = this.totalItems - this.processedItems;
      const msRemaining = (elapsedMs / this.processedItems) * remaining;
      etr = (msRemaining / 1000).toFixed(2) + "s";
    }

    const percent = this.totalItems > 0 
      ? ((this.processedItems / this.totalItems) * 100).toFixed(1) 
      : "0.0";
    
    this.log('INFO', 
      `PRG: ${percent}% | ${this.processedItems}/${this.totalItems} | ` +
      `CUR: ${identifier} | SPD: ${itemsPerSecond}/s | ETR: ${etr}`
    );
  }

  finish() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.log('INFO', `COMPLETED | TIME: ${totalTime}s | TOTAL: ${this.processedItems}`);
  }
}