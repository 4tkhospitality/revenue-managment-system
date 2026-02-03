import Papa from 'papaparse';

export interface CSVRow {
    reservation_id: string;
    booking_date: string;
    arrival_date: string;
    departure_date: string;
    rooms: string;
    revenue: string;
    status: string;
    cancel_date?: string;
    [key: string]: any;
}

export const CSVUtils = {
    parseString: (csvString: string): Promise<CSVRow[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(csvString, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn("CSV Parse warnings:", results.errors);
                    }
                    resolve(results.data as CSVRow[]);
                },
                error: (error: Error) => {
                    reject(error);
                }
            });
        });
    }
};
