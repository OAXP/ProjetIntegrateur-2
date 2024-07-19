export class Fiche {
    difficulty: string;
    differences: number;
    name: string;
    available?: boolean = false;
    image1Url: string;
    image2Url: string;
    diffImageUrl: string;

    constructor(name: string, difficulty: string, differences: number, imgUrl: string) {
        this.name = name;
        this.difficulty = difficulty;
        this.differences = differences;
        this.image1Url = imgUrl;
    }
}
