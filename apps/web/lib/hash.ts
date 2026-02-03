import { createHash } from 'crypto';

export const HashUtils = {
    computeFileHash: (fileBuffer: Buffer): string => {
        const hash = createHash('sha256');
        hash.update(fileBuffer);
        return hash.digest('hex');
    }
};
