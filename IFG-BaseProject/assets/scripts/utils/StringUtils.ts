export class StringUtils {
    // Formats a number of seconds to a string like: 12:34
    // 2 digits of precision for each minute/second component.
    // This could be generalized to support hours, etc.
    public static formatTimer(timeInSeconds: number, showHours: boolean): string {
        if (timeInSeconds < 0) {
            if (showHours) {
                return '00:00:00';
            } else {
                return '00:00';
            }
        }

        if (showHours) {
            const hours = Math.floor(timeInSeconds / 3600);
            const mins = Math.floor((timeInSeconds - hours * 3600) / 60);
            const secs = Math.floor(timeInSeconds - mins * 60 - hours * 3600);

            const formattedHours = hours < 9 ? `0${hours}` : hours.toString();
            const formattedMins = mins < 9 ? `0${mins}` : mins.toString();
            const formattedSecs = secs < 10 ? `0${secs}` : secs.toString();

            return `${formattedHours}:${formattedMins}:${formattedSecs}`;
        } else {
            const mins = Math.floor(timeInSeconds / 60);
            const secs = Math.floor(timeInSeconds - mins * 60);

            const formattedMins = mins < 9 ? `0${mins}` : mins.toString();
            const formattedSecs = secs < 10 ? `0${secs}` : secs.toString();

            return `${formattedMins}:${formattedSecs}`;
        }
    }
}
