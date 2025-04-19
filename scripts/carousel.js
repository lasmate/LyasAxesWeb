class HDcarousel{
    version = 0.1;
    el = null;
    items=[];
    size =3;
    gap = 0;
    item = {
        width:0,
        gap:0,
        left:0,
    }


 
    constructor(el){
        console.log("HDcarousel v" + this.version + "init")

        this.el = el
    }

    async init(){
        this.item.width=await this.getSize();
    }

    async getSize(){
        let w = this.el.clientWidth;
        w = w / this.size;
        return w;
    }
}
const el= document.getElementsByClassName("hdcarousel")
new HDcarousel(el);