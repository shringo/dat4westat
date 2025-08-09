import { parse } from "csv-parse/browser/esm/sync";

/**
 * Converts CSV text to CDC Westat .dat file.
 * 
 * This assumes the CSV has a header row (row with names for each column)
 * @param contents String of CSV
 * @param isMiddleSchool Whether or not the CSV is middle school data.
 * @returns Blob to download if successfully converted, otherwise a string for the error.
 */
export default function convertFile(contents: string, isMiddleSchool: boolean): Blob | string {
    const surveys: string[][] = parse(contents, { skip_empty_lines: true, fromLine: 2 });

    let dats = [];
    for(const k in surveys) {
        const survey = surveys[k];
        const datEntry: { str: string; passwordCard: string } = {
            str: "",
            passwordCard: ""
        }
        // add 40 empty columns for Westat internal processing
        datEntry.str += ' '.repeat(40);
        for(let i = 1; i <= survey.length; i++) {
            const answer = survey[i - 1];
            // if on the ethnicity question, convert list to letters and add spaces in between for answers that aren't marked
            if (i === 4) {
                const ethnicities = answer.split(',');
                for(let j = 1; j <= 8; j++) {
                    if(ethnicities.includes(j.toString()))
                        datEntry.str += mapNumberToLetter(j);
                    else
                        datEntry.str += ' ';
                }
            // if middle school, put in blank info for weight and height
            } else if (isMiddleSchool && i === 5) {
                datEntry.str += ' '.repeat(2 * 3);
                datEntry.str += mapNumberToLetter(answer);
            // if high school, add answers as numbers and do not convert to letters
            } else if (!isMiddleSchool && 5 <= i && i <= 7) {
                // weight (COMES LAST)
                if (i === 7) {
                    if (answer.length)
                        datEntry.str += answer.padStart(3, '0');
                    else datEntry.str += ' '.repeat(3);
                } else {
                    if (answer.length)
                        datEntry.str += (i === 6 ? answer.padStart(2, '0') : answer);
                    else datEntry.str += ' '.repeat(i === 6 ? 2 : 1);
                }
            // answers shouldn't be longer than 1 character, as ethnicity question was already covered
            // this must be the PCID so we skip it
            } else if (answer.length > 1) {
                continue;
            } else datEntry.str += mapNumberToLetter(answer);
        }
        // add padding for questions not on survey till PC school ID
        datEntry.str += ' '.repeat(211 - datEntry.str.length - 1);
        datEntry.passwordCard = survey[survey.length - 1];
        dats.push(datEntry);
    }
    dats = dats.sort((a, b) => parseInt(a.passwordCard) - parseInt(b.passwordCard));
    const finalDat = dats.map(s => {
        const passwordCard = decomposePasswordCard(s.passwordCard);
        // reference to string
        let str = s.str;
        // right justified, 10 wide
        str += ' '.repeat(10 - passwordCard[0].toString().length);
        str += passwordCard[0];
        // right justified, 3 wide
        str += ' '.repeat(3 - passwordCard[1].toString().length);
        str += passwordCard[1];
        return str;
    }).filter(s => s.trim().length).join('\n');

    return new Blob([finalDat], { type: 'text/plain' });
}

type passwordCardDecomposition = [number, number, number];

/**
 * converts a number or letter to a letter. For invalid input, * (asterisk) is returned.
 *  A -> A
 * -1 -> *
 *  9 -> *
 *  2 -> B
 * @param num between 1 and 8
 * @returns A B C D E F G H, or * for invalid input
 */
function mapNumberToLetter(num: string | number): string {
    const actNum = (typeof num === "number" ? num : parseInt(num)) - 1;
    if (typeof num === "string" && !num.length)
        return ' ';
    if(actNum >= 8 || actNum < 0) return "*";
    const letter = "ABCDEFGH"[actNum];
    if(!letter) throw new Error("couldn't map " + num + " to letter");
    else return letter;
}

/**
 * Breaks down the PCID (password card) used to access the survey into an array
 * @param str 8 digit number.
 * @returns [HS or MS (1 length) + school ID(2 length), class ID(3 length), student(2 length)]
 */
function decomposePasswordCard(str: string): passwordCardDecomposition {
    return [
        parseInt(str.slice(1, 3)),
        parseInt(str.slice(3, 6)),
        parseInt(str.slice(6))
    ];
}