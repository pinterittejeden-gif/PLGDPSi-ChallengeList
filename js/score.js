/**
 * Numbers of decimal digits to round to
 */
const scale = 3;

/**
 * Calculate the score awarded when having a certain percentage on a list level
 * @param {Number} rank Position on the list
 * @param {Number} percent Percentage of completion
 * @param {Number} minPercent Minimum percentage required
 * @returns {Number}
 */
export function score(rank, percent, minPercent) {
    if (rank > 150) {
        return 0;
    }
    if (rank > 75 && percent < 100) {
        return 0;
    }

    // Old formula
    /*
    let score = (100 / Math.sqrt((rank - 1) / 50 + 0.444444) - 50) *
        ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));
    */
    // New formula
    let score = (-24.9975*Math.pow(rank-1, 0.4) + 200) *
        ((percent - (minPercent - 1)) / (100 - (minPercent - 1)));

    score = Math.max(0, score);

    if (percent != 100) {
        return round(score - score / 3);
    }

    return Math.max(round(score), 0);
}

export function round(num) {
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = '';
        if (+arr[1] + scale > 0) {
            sig = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}

/**
 * Punkty listy za level na danej pozycji (lagodna krzywa wykladnicza).
 * top 1 = 500 pkt, ostatni = 1 pkt. Im wieksze K, tym ostrzejszy spadek.
 */
const LIST_POINT_K = 3;
export function listPoints(pos, count) {
    if (count <= 1) return 500;
    if (pos > count || pos < 1) return 0;
    const t = (pos - 1) / (count - 1);
    const low = Math.exp(-LIST_POINT_K);
    const value = 1 + 499 * ((Math.exp(-LIST_POINT_K * t) - low) / (1 - low));
    return Math.round(value * 10) / 10;
}
