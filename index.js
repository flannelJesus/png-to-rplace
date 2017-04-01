"use strict";

const parsePng = require('parse-png');
const diff = require('color-diff');
const fs = require('fs');

/**
 *
 * @param {String} fileName
 * @return {Promise}
 */
function parsePngFile(fileName) {
    return parsePng(fs.readFileSync(fileName)).then(png => {
        // png.data is an array of integers
        // every 4 elements in the array represents 1 pixel
        // the first 3 elements of those 4 are R, G, B values.
        // the fourth is transparency
        //
        // png.width is what you'd expect: the width of the png

        var p = new Pixel();

        let pixels = [];

        let addPixel = function(pixel){
            if (pixel.isComplete()) {
                let newPixel = new Pixel(pixel);
                pixels.push(newPixel);
                p = new Pixel();
            }
        };


        png.data.forEach(function(val){
            p.addNextValue(val);
            addPixel(p);
        });

        return {pixels: pixels, width: png.width};
    });
}

Promise.all([parsePngFile("base-colors.png"), parsePngFile("image.png")]).then((results) => {
    let baseColors = results[0];
    let imagePixels = results[1];

    let placePixels = [];

    var x = 0;
    var y = 0;

    var xOffset = 235;
    var yOffset = 295;

    imagePixels.pixels.forEach((pixel, i) => {
        var closest = diff.closest(pixel, baseColors.pixels);
        var index = baseColors.pixels.indexOf(closest);

        placePixels.push(new PlacePixel(x+xOffset, y+yOffset, index));
        x += 1;
        if (x%imagePixels.width === 0) {
            x = 0;
            y += 1;
        }

    });

    console.log(JSON.stringify(placePixels));
});

class Pixel {
    constructor(obj) {
        this.R = null;
        this.G = null;
        this.B = null;
        this.O = null;

        if (obj) {
            Object.assign(this, obj);
        }
    }

    /**
     * Returns whether or not the pixel has an R,G,B and O value
     *
     * @returns {boolean}
     */
    isComplete() {
        //
        return this.R != null && this.G != null && this.B != null && this.O != null;
    }

    /**
     * Adds R, G, B values in order
     * returns false if pixel is not complete
     * otherwise returns true
     *
     * @param {Number} val
     * @returns {boolean}
     */
    addNextValue(val) {
        val = Number(val);
        if (this.R == null) {
            this.R = val;
            return false;
        }
        if (this.G == null) {
            this.G = val;
            return false;
        }
        if (this.B == null) {
            this.B = val;
            return false;
        }
        if (this.O == null) {
            this.O = val;
            return true;
        }
    }
}

class PlacePixel {
    constructor(x, y, colorIndex) {
        this.x = x;
        this.y = y;
        this.colorIndex = colorIndex;
    }
}
