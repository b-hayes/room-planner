export default class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // Method to calculate magnitude of the vector
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    // Method to calculate dot product with another vector
    dotProduct(otherVector) {
        return this.x * otherVector.x + this.y * otherVector.y;
    }

    // Method to calculate angle between this vector and another vector with a common point
    angleBetween(otherVector, commonPoint) {
        // Vectors from the common point to the other points
        let vector1 = new Vector(this.x - commonPoint.x, this.y - commonPoint.y);
        let vector2 = new Vector(otherVector.x - commonPoint.x, otherVector.y - commonPoint.y);

        // Dot product of the vectors
        let dotProduct = vector1.dotProduct(vector2);

        // Magnitudes of the vectors
        let magnitude1 = vector1.magnitude();
        let magnitude2 = vector2.magnitude();

        // Cosine of the angle between the vectors
        let cosTheta = dotProduct / (magnitude1 * magnitude2);

        // Angle in radians
        let theta = Math.acos(cosTheta);

        // Convert radians to degrees
        let degrees = theta * (180 / Math.PI);

        // Determine if the angle is clockwise or counterclockwise
        // Cross product of the vectors
        let crossProduct = vector1.x * vector2.y - vector1.y * vector2.x;

        // If counterclockwise, make the angle negative
        if (crossProduct < 0) {
            degrees = -degrees;
        }

        return degrees;
    }
}
