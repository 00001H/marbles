let box: HTMLDivElement;
let pieces: HTMLDivElement[] = [];
let pmc: HTMLSpanElement;
let hs: HTMLDivElement;
let hsent: HTMLParagraphElement[] = [];
let SEQU = "0123456789abcdefghijklmnopqrstuvwxyz";
function sequ(x: number){
    return SEQU[x]??String(x);
}
type Move = {
    src: number,
    dst: number
};
let select: number|null = null;
enum Piece{
    EMPTY="empty",WHITE="white",BLACK="black"
};
function desel(){
    select = null;
    pmc.textContent = "";
}
function selpiece(i: number){
    if(select===null){
        if(i===(experiment.length-1)||experiment.get(i)===Piece.EMPTY||experiment.get(i+1)===Piece.EMPTY){
            return;
        }
        select = i;
        pmc.textContent = sequ(i);
    }else{
        if(i!==(experiment.length-1)&&experiment.get(i)===Piece.EMPTY&&experiment.get(i+1)===Piece.EMPTY){
            experiment.move(select,i);
        }
        desel();
    }
}
class Board{
    private _state: Piece[] = [];
    visual: boolean = false;
    mlist: Move[] = [];
    mptr: number = 0;
    constructor(size: number){
        for(let i=0;i<size;++i){
            this._state.push(Piece.EMPTY);
        }
        this.restart();
    }
    get length(){
        return this._state.length;
    }
    visualize(cue: boolean=true){
        this.visual = true;
        hs.replaceChildren();
        box.replaceChildren();
        for(let p of pieces){
            p.remove();
        }
        let sd: HTMLDivElement;
        for(let i=0;i<this.length;++i){
            sd = new_slot(cue?sequ(i):null);
            sd.addEventListener("click",() => {
                selpiece(i);
            });
            pieces.push(sd);
            box.append(sd);
        }
        for(let i=0;i<this.length;++i)this.set(i,this.get(i));
    }
    get(i: number){
        return this._state[i];
    }
    set(i: number,state: Piece){
        this._state[i] = state;
        if(this.visual){
            pieces[i].setAttribute("state",this.get(i));
        }
    }
    pushmove(src: number,dst: number){
        if(this.mptr<this.mlist.length){
            do{
                if(this.visual){
                    hsent.pop().remove();
                }
            }while(--this.mlist.length>this.mptr);
        }
        this.mlist.push({src: src,dst: dst});
        let mptr = ++this.mptr;
        if(this.visual){
            let entry = document.createElement("p");
            entry.addEventListener("click",()=>{
                this.do_to(mptr);
            });
            let lhs = document.createElement("span");
            lhs.classList.add("lhs");
            lhs.textContent = sequ(src);
            entry.append(lhs);
            entry.append("->");
            let rhs = document.createElement("span");
            rhs.classList.add("rhs");
            rhs.textContent = sequ(dst);
            entry.append(rhs);
            hs.append(entry);
            hsent.push(entry);
        }
    }
    undo(){
        if(this.mptr){
            let mv = this.mlist[--this.mptr];
            hsent[this.mptr].classList.add("inactive");
            this.move(mv.dst,mv.src,false);
        }
    }
    redo(){
        if(this.mptr<this.mlist.length){
            hsent[this.mptr].classList.remove("inactive");
            let mv = this.mlist[this.mptr++];
            this.move(mv.src,mv.dst,false);
        }
    }
    do_to(i: number){
        i = Math.max(0,Math.min(i,this.mlist.length));
        if(this.mptr<i){
            do{
                this.redo();
            }while(this.mptr<i);
        }else while(this.mptr>i){
            this.undo();
        }
    }
    move(src: number,dst: number,record: boolean=true){
        if(record){
            this.pushmove(src,dst);
        }
        let u = this.get(src);
        this.set(src,Piece.EMPTY);
        let v = this.get(src+1);
        this.set(src+1,Piece.EMPTY);
        this.set(dst,u);
        this.set(dst+1,v);
    }
    restart(){
        let white = false;
        for(let i=0;i<this.length;++i){
            if(i<4){
                this.set(i,Piece.EMPTY);
            }else{
                this.set(i,white?Piece.WHITE:Piece.BLACK);
                white = !white;
            }
        }
        this.mptr = 0;
        this.mlist = [];
        if(this.visual){
            for(let h of hsent){
                h.remove();
            }
            hsent = [];
        }
    }
};
let experiment: Board = new Board(20);
function new_slot(cue: string|null=null) : HTMLDivElement{
    let sl = document.createElement("div");
    sl.classList.add("slot");
    if(cue!==null){
        let cuetext = document.createElement("p");
        cuetext.classList.add("cue");
        cuetext.textContent = cue;
        sl.append(cuetext);
    }
    sl.setAttribute("state","empty");
    let hl = document.createElement("div");
    hl.classList.add("highlight");
    sl.append(hl);
    return sl;
}
function sleep(ms: number){
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function mvlist(mvs: Move[],animate: number){
    let rev = mvs.toReversed();
    while(rev.length){
        await sleep(animate);
        let m = rev.pop();
        experiment.move(m.src,m.dst);
    }
}
function alsolve(){
    let marbles = experiment.length-4;
    if(marbles&1){
        alert("Marbles not paired!");
    }
    marbles >>= 1;
    if(marbles<3){
        alert("Must have at least 3 pairs!");
    }
    let mlist: Move[] = [
        {src: 5,dst: 2},
        {src: 8,dst: 5},
        {src: 6,dst: 0}
    ];
    for(let i=3;i<marbles;++i){
        mlist.push({src: i-1, dst: i*2+2});
        mlist.push({src: i*2+3, dst: i*2});
        mlist.push({src: 0, dst: i*2+3});
        mlist.push({src: i*2+2, dst: 0});
        mlist.push({src: i*2+4, dst: i-1});
    }
    return mlist;
}
addEventListener("load",() => {
    box = document.getElementById("row") as HTMLDivElement;
    pmc = document.getElementById("lhs") as HTMLSpanElement;
    hs = document.getElementById("history") as HTMLDivElement;
    experiment.visualize();
    document.getElementById("undo").addEventListener("click",()=>{
        experiment.undo();
    });
    document.getElementById("redo").addEventListener("click",()=>{
        experiment.redo();
    });
    addEventListener("keyup",async (e)=>{
        if(e.altKey||e.shiftKey||e.metaKey){
            return;
        }
        let k = e.key;
        if(k==="z"||k==="ArrowLeft"){
            experiment.undo();
        }else if(k==="y"||k==="ArrowRight"){
            experiment.redo();
        }else if(k==="r"){
            experiment.restart();
        }else if(k==="s"){
            experiment.restart();
            await mvlist(alsolve(),100);
        }else if(k==="Backspace"){
            desel();
        }else if(!e.ctrlKey&&k.length===1&&SEQU.includes(k)){
            selpiece(SEQU.indexOf(k));
        }
    });
});
