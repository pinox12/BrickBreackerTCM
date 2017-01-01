/**
 * Created by xavipi and christianmenbrive on 27/05/4017.
 */

var game;

$(document).ready(function () {

    game = new Game();
    startEvents();

});

function play() {

    if (document.getElementById("innick").value.length < 1) {
        $("#innick").css("color", "red");
    } else {
        game.menu = false;
        if (!game.retry) {
            $("#menu").fadeOut(500);
            var joc = $("#joc");
            var ins = $("#intructions");
            var dgame = $("#game");
            joc.fadeIn(500);

            ins.css({
                "left": (Utilitats.getX(dgame[0]) + (parseInt(dgame.css("width")) / 2) - parseInt(ins.css("width")) / 2),
                "top": (Utilitats.getY(dgame[0]) + (parseInt(dgame.css("height")) / 2) - parseInt(ins.css("height")) / 2)
            });
            var menuGame = $("#menuGame");

            menuGame.css({
                "left": (Utilitats.getX(dgame[0]) + (parseInt(dgame.css("width")) / 2) - parseInt(menuGame.css("width")) / 2),
                "top": (Utilitats.getY(dgame[0]) + (parseInt(dgame.css("height")) / 2) - parseInt(menuGame.css("height")) / 2)
            });

            ins.fadeIn(500);

            $("#ok").on("click", function () {
                ins.fadeOut(200);
                joc.removeClass("blur");
                game.inGame = true;

            });

        } else {
            delete game.ball;
            delete game.paddle;
            $("#menuGame").fadeOut(500);
            game.inGame = true;
        }
        game.nivell = 1;
        game.inicialitzar();
        game.retry = true;


    }
}

function mainLoop() {
    game.update();
    game.draw();
    game.myReq = requestAnimationFrame(mainLoop);
}

function startEvents() {

    $("#play").on("click", function () {
        play();
    });

    $("#retry").on("click", function () {
        play();
    });

    $(document).on("keydown", function (e) {
        if (e.keyCode == 13) {
            if (!game.inGame) play();
        }
    });

    $("#game").on("click", function () {
        if (game.inGame) {
            game.ball.stop = false;
        }
    });

    $("#innick").on("click", function () {
        $("#innick").css("color", "#e0e0ff");
    });

    $("#bNivellUp").on("click", function () {
        game.display.vidas.num--;
        game.display.marcador-=100;
        game.levelUp();
    });

    $("#bNivellDown").on("click", function () {
        game.levelDown();
    });

    $(".audio").on("click", function () {
        if (game.audios.soundMusic) {
            game.audios.stopMusic();
        } else {
            game.audios.playMusic();
        }
    });
}


///////////////////////////////////    Objecte game

function Game() {
    this.AMPLADA_TOTXO = 50;
    this.ALÇADA_TOTXO = 25; // MIDES DEL TOTXO EN PÍXELS
    this.canvas, this.context;       // context per poder dibuixar en el Canvas
    this.width, this.height;          // mides del canvas

    this.display;
    this.paddle;
    this.ball;
    this.mur;


    this.nivell = 1;
    this.t = 0;

    this.retry = false;
    this.inGame = false;

    this.audios = new Audios();
    this.powers = new PowerUps();

    this.key = {
        RIGHT: {code: 39, pressed: false},
        LEFT: {code: 37, pressed: false},
        SAPCEBAR: {code: 32, pressed: false}
    };
}

Game.prototype.inicialitzar = function () {
    this.canvas = document.getElementById("game");
    this.width = this.AMPLADA_TOTXO * 15;  // 15 totxos com a màxim d'amplada
    this.canvas.width = this.width;
    this.height = this.ALÇADA_TOTXO * 25;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d");
    this.mousePos = {x: 0, y: 0};

    this.paddle = new Paddle();
    this.ball = new Ball();
    this.display = new Display(document.getElementById("innick").value);
    this.mur = new Mur();


    // Events amb jQuery
    $(document).on("keydown", {game: this}, function (e) {
        if (e.keyCode == e.data.game.key.RIGHT.code) {
            e.data.game.key.RIGHT.pressed = true;
        }
        else if (e.keyCode == e.data.game.key.LEFT.code) {
            e.data.game.key.LEFT.pressed = true;
        }
        else if (e.keyCode == e.data.game.key.SAPCEBAR.code) {
            e.data.game.key.SAPCEBAR.pressed = true;
        }
    });
    $(document).on("keyup", {game: this}, function (e) {
        if (e.keyCode == e.data.game.key.RIGHT.code) {
            e.data.game.key.RIGHT.pressed = false;
        }
        else if (e.keyCode == e.data.game.key.LEFT.code) {
            e.data.game.key.LEFT.pressed = false;
        }
        else if (e.keyCode == e.data.game.key.SAPCEBAR.code) {
            e.data.game.key.SAPCEBAR.pressed = false;
        }
    });

    this.t = new Date().getTime();     // inicialitzem el temps

    if (!game.retry)
        game.canvas.addEventListener('mousemove', function (evt) {
            Game.getMousePos(evt);

            if (game.mousePos.x > game.paddle.width / 2 && game.mousePos.x < (game.width - game.paddle.width / 2)) {
                game.paddle.x = game.mousePos.x - game.paddle.width / 2;
            }
        }, false);
    this.myReq = requestAnimationFrame(mainLoop);
};

Game.prototype.draw = function () {

    this.context.clearRect(0, 0, this.width, this.height);

    this.mur.draw(this.context);
    this.paddle.draw(this.context);
    this.ball.draw(this.context);
};

Game.prototype.update = function () {

    var dt = Math.min((new Date().getTime() - this.t) / 1000, 1); // temps, en segons, que ha passat des del darrer update
    this.t = new Date().getTime();

    this.paddle.update();    // Moviment de la raqueta
    this.ball.update(dt);    // moviment de la bola, depen del temps que ha passat

    if (this.mur.totxo.length <= 0) {
        this.levelUp();
    }


    if (this.ball.stop) {
        this.ball.x = this.paddle.x + this.paddle.width - this.paddle.width / 2;
        this.ball.y = this.paddle.y - this.ball.radi - 2;
    }

    if (game.key.SAPCEBAR.pressed && this.inGame) {
        this.ball.stop = false;
    }
};

Game.prototype.llegirNivells = function () {

    this.NIVELLS = [
        {
            colors: {
                t: "#F77", // taronja
                c: "#4CF", // blue cel
                v: "#8D1", // verd
                e: "#D30", // vermell
                l: "#00D", // blau
                r: "#F7B", // rosa
                p: "#BBB" // plata
            },
            totxos: [
                "               ",
                "               ",
                "       p       ",
                "     ttttt     ",
                "    ccccccc    ",
                "   vvVvvvVvv   ",
                "   eeeeeeeee   ",
                "   lllllllll   ",
                "   r r r r r   "
            ]
        },
        {
            colors: {
                t: "#F77", // taronja
                c: "#4CF", // blue cel
                v: "#8D1", // verd
                e: "#D30", // vermell
                l: "#00D", // blau
                r: "#F7B", // rosa
                g: "#F93", // groc
                p: "#BBB" // plata
            },
            totxos: [
                "               ",
                "               ",
                "  ppp     ppp  ",
                "  tt       tt  ",
                "  cc       cc  ",
                "  vv       vv  ",
                "  eeeEeeeEeee  ",
                "  lllllllllll  ",
                "   r r r r r   ",
                "      ggg      "
            ]
        },
        {
            colors: {
                b: "#FFF", // blanc
                t: "#F77", // taronja
                c: "#4CF", // blue cel
                v: "#8D1", // verd
                e: "#D30", // vermell
                l: "#00D", // blau
                r: "#F7B", // rosa
                g: "#F93", // groc
                p: "#BBB", // plata
                d: "#FB4" // dorat
            },
            totxos: [
                "               ",
                " ddd           ",
                " pppp          ",
                " ttttt         ",
                " cccccc        ",
                " vvvvvvv       ",
                " eeeeeeee      ",
                " lllLlllll     ",
                " rrrrrrrrrr    ",
                " ggggggGgggg   ",
                " bbbbbbbbbbbb  ",
                " ddddddddddddd "
            ]
        },
        {
            colors: {
                r: "#D40000", // vermell
                g: "#6D8902", // verd
                y: "#EBAD00" // groc
            },
            totxos: [
                "               ",
                "     rrrrrr    ",
                "    rrrrrrrrr  ",
                "    gggyygy    ",
                "   gygyyygyyy  ",
                "   gyggyYygyyy ",
                "   ggyyyygggg  ",
                "     yyyyyyy   ",
                "    ggrggg     ",
                "   gggrggrggg  ",
                "  ggggrRrrgggg ",
                "  yygryrryrgyy ",
                "  yyyrrrrrryyy ",
                "    rrr  rrr   ",
                "   ggg    ggg  ",
                "  gggg    gggg "
            ]
        },
        {
            colors: {
                b: "#333333",
                g: "#E0E0E0",
                c: "#FACD8A",
                g: "#666666",
                y: "#FFCC00"
            },

            totxos: [

                "               ",
                "   bbbbbbbb    ",
                "    bbbbbbbb   ",
                "     bbbbgbb   ",
                "    bbbbbgbbb  ",
                "    bbbbbbbccc ",
                "    bbbbbbbcc  ",
                "     bbbbbbb   ",
                "   nbbbbbbbnnn ",
                "  ngbbbbbbbbgn ",
                " ngggggyygggggn",
                " nggnggggggnggn",
                " nbbbyyyyyybbbn",
                " nbbnbbbbbbnbbn",
                " nnngggbbgggnnn",
                "   ggg    ggg  ",
                "  bbbb    bbbb ",

            ]
        },
        {
            colors: {
                b: "#000000",
                g: "#28AA55"


            },

            totxos: [

                "     bbbbbb    ",
                "   bbgggg bb   ",
                "  b  gggg   b  ",
                " b  gggggg   b ",
                " b gg    gg  b ",
                "bggg      gggb ",
                "bggg      gg gb",
                "b gg      g   b",
                "b  gg    gg   b",
                "b  ggggggggg gb",
                "b ggbbbbbbbbggb",
                " bbb  b  b  bb ",
                "  b   b  b   b ",
                "  b          b ",
                "   b        b  ",
                "    bbbbbbbb   "


            ]
        }

    ]
    ;
};

Game.prototype.levelUp = function () {

    if (this.nivell == this.NIVELLS.length - 1) {
        this.nivell = 1;
    } else {
        this.nivell++;
    }
    this.display.marcador+=100;
    $(".sNivell").text(this.nivell);
    this.display.vidaExtra();

    delete this.paddle;
    delete this.ball;
    this.paddle = new Paddle();
    this.ball = new Ball();

    this.mur.inicialitzar();

};

Game.prototype.levelDown = function () {

    if (this.nivell == 1) {
        this.nivell = this.NIVELLS.length - 1;
    } else {
        this.nivell--;
    }
    $(".sNivell").text(this.nivell);

    delete this.paddle;
    delete this.ball;
    this.paddle = new Paddle();
    this.ball = new Ball();

    this.mur.inicialitzar();
};

Game.getMousePos = function (evt) {
    var rect = game.canvas.getBoundingClientRect();
    game.mousePos.x = evt.clientX - rect.left;
    game.mousePos.y = evt.clientY - rect.top;
};


///////////////////////////////////    Objecte Mur

function Mur() {

    game.llegirNivells();
    this.totxo = [];
    this.inicialitzar();

}

Mur.prototype.inicialitzar = function () {
    this.totxo = [];
    var lletra, aux;
    for (var y = 0; y < game.NIVELLS[game.nivell].totxos.length; y++) {
        for (var x = 0; x < 15; x++) {
            lletra = game.NIVELLS[game.nivell].totxos[y].substr(x, 1);
            if (lletra != " ") {
                aux = lletra.toUpperCase();
                if (lletra != aux) {
                    this.totxo.push(new Totxo(
                        x * game.AMPLADA_TOTXO, y * game.ALÇADA_TOTXO,
                        game.AMPLADA_TOTXO, game.ALÇADA_TOTXO,
                        game.NIVELLS[game.nivell].colors[lletra], false));
                } else {
                    this.totxo.push(new Totxo(
                        x * game.AMPLADA_TOTXO, y * game.ALÇADA_TOTXO,
                        game.AMPLADA_TOTXO, game.ALÇADA_TOTXO,
                        game.NIVELLS[game.nivell].colors[lletra], true));
                }
            }
        }
    }
};

Mur.prototype.draw = function (ctx) {
    for (var i in this.totxo) {
        this.totxo[i].draw(ctx);
    }
};


///////////////////////////////////    Object Display

function Display(nick) {

    this.nick = nick;
    this.marcador = 0;
    this.vidas = {num: 3, html: [$("#v1"), $("#v2"), $("#v3"), $("#v4")]};
    this.time;
    this.top = {
        html: [$("#top1"), $("#top2"), $("#top3")],
        val: [0, 0, 0],
        nick: ["--------", "---------", "---------"]
    };

    $(".sNivell").text(game.nivell);
    $(".nick").text(this.nick);
    $(".marcador").text(this.marcador);

    for (var j = 0; j < 3; j++) {
        this.vidas.html[j].css("display", "inline-block");
    }

    for (var i = 0; i < 3; i++) {
        if (localStorage.getItem("top" + (i + 1))) {
            this.top.val[i] = localStorage.getItem("top" + (i + 1));
            this.top.nick[i] = localStorage.getItem("top" + (i + 1) + "nick");
        }
        this.top.html[i].text(this.top.nick[i]);
    }


}

Display.prototype.vidaPerduda = function () {
    if (this.vidas.num > 1) {


        this.vidas.num--;
        this.vidas.html[this.vidas.num].css("display", "none");


        delete game.ball;
        delete game.paddle;

        game.paddle = new Paddle();
        game.ball = new Ball();


    } else if (this.vidas.num == 1) {

        this.vidas.num = 0;
        this.vidas.html[this.vidas.num].css("display", "none");
        game.inGame = false;

        $("#menuGame").fadeIn(500);

        if (this.top.val[2] < this.marcador) {
            if (this.top.val[1] < this.marcador) {
                if (this.top.val[0] < this.marcador) {

                    this.top.val[2] = this.top.val[1];
                    this.top.nick[2] = this.top.nick[1];
                    this.top.val[1] = this.top.val[0];
                    this.top.nick[1] = this.top.nick[0];
                    this.top.val[0] = this.marcador;
                    this.top.nick[0] = this.nick;
                } else {
                    this.top.val[2] = this.top.val[1];
                    this.top.nick[2] = this.top.nick[1];
                    this.top.val[1] = this.marcador;
                    this.top.nick[1] = this.nick;
                }
            } else {
                this.top.val[2] = this.marcador;
                this.top.nick[2] = this.nick;
            }
            localStorage.setItem("top3", this.top.val[2]);
            localStorage.setItem("top3nick", this.top.nick[2]);
            localStorage.setItem("top2", this.top.val[1]);
            localStorage.setItem("top2nick", this.top.nick[1]);
            localStorage.setItem("top1", this.top.val[0]);
            localStorage.setItem("top1nick", this.top.nick[0]);
        }

    }
};

Display.prototype.vidaExtra = function () {
    if (this.vidas.num < 4) {
        this.vidas.html[this.vidas.num].css("display", "inline-block");
        this.vidas.num++;
    }
};


///////////////////////////////////    Object Paddle

function Paddle() {
    this.width = 200;
    this.height = 20;
    this.x = game.width / 2 - this.width / 2;
    this.y = game.height - 50;
    this.vx = 10;
    this.color = "#FFF"; // vermell

    this.puntCercle = {punt: {x: this.x, y: 0}, radi: 200};
    this.puntCercle.punt.y = this.y + Math.sqrt(Math.pow(this.puntCercle.radi, 2) - Math.pow(this.width / 2, 2));
}

Paddle.prototype.update = function () {

    if (game.key.RIGHT.pressed) {
        this.x = Math.min(game.width - this.width, this.x + this.vx);
        this.puntCercle.punt.x = Math.min(game.width - (this.width / 2), this.x + this.vx);
    }
    else if (game.key.LEFT.pressed) {
        this.x = Math.max(0, this.x - this.vx);
        this.puntCercle.punt.x = Math.max(this.width / 2, this.x - this.vx);
    }
};

Paddle.prototype.draw = function (ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
};


///////////////////////////////////    Object Ball

function Ball() {
    this.radi = 10;                 // radi de la pilota
    this.x = game.paddle.x + game.paddle.width - game.paddle.width / 2;
    this.y = game.paddle.y - this.radi - 2;         // posició del centre de la pilota
    this.color = "#FFF";  // gris fosc
    this.vmax = 450;//425
    this.vx = 0;
    this.vy = -this.vmax;

    this.stop = true;


}

Ball.prototype.update = function (dt) {
    var dtXoc;      // temps empleat fins al xoc
    var xoc = false;  // si hi ha xoc en aquest dt
    var k;          // proporció de la trajectoria que supera al xoc
    var trajectoria = {};
    trajectoria.p1 = {x: this.x, y: this.y};
    trajectoria.p2 = {x: this.x + this.vx * dt, y: this.y + this.vy * dt};  // nova posició de la bola

    // mirem tots els possibles xocs de la bola

    // Xoc amb la vora de sota de la pista
    if (trajectoria.p2.y + this.radi > game.height) {
        game.display.vidaPerduda();
    }

    // Xoc amb la vora de dalt de la pista
    if (trajectoria.p2.y - this.radi < 0) {
        k = (trajectoria.p2.y - this.radi) / this.vy;  // k sempre positiu
        // ens col·loquem just tocant la vora de dalt
        this.x = trajectoria.p2.x - k * this.vx;
        this.y = this.radi;
        this.vy = -this.vy;
        dtXoc = k * dt;  // temps que queda
        xoc = true;
    }

    // Xoc amb la vora dreta de la pista
    if (trajectoria.p2.x + this.radi > game.width) {
        k = (trajectoria.p2.x + this.radi - game.width) / this.vx;
        // ens col·loquem just tocant la vora de la dreta
        this.x = game.width - this.radi;
        this.y = trajectoria.p2.y - k * this.vy;
        this.vx = -this.vx;
        dtXoc = k * dt;  // temps que queda
        xoc = true;
    }

    // Xoc amb la vora esquerra de la pista
    if (trajectoria.p2.x - this.radi < 0) {
        k = (trajectoria.p2.x - this.radi) / this.vx;  // k sempre positiu
        // ens col·loquem just tocant la vora de l'esquerra
        this.x = this.radi;
        this.y = trajectoria.p2.y - k * this.vy;
        this.vx = -this.vx;
        dtXoc = k * dt;  // temps que queda
        xoc = true;
    }


    // Xoc amb la raqueta
    var pXoc = Utilitats.interseccioSegmentRectangle(trajectoria, {
        p: {x: game.paddle.x - this.radi, y: game.paddle.y - this.radi},
        w: game.paddle.width + 2 * this.radi,
        h: game.paddle.height + 2 * this.radi
    });
    if (pXoc) {
        xoc = true;
        this.x = pXoc.p.x;
        this.y = pXoc.p.y;

        var mig = (game.paddle.x + game.paddle.width - (game.paddle.width / 2));
        var dif = Math.abs(mig - this.x);
        var alpha = 45;
        var beta = this.getAngle();
        var gamma = this.getAngle2(dif);
        var res;


        if (beta < 90) {
            if (this.x > mig) {
                alpha = 90 - beta - gamma;
                res = 90 + gamma - alpha + 45;

            } else {
                alpha = 90 + gamma - beta;
                res = beta + (2 * alpha);
            }
            if (res < 90)res = 90;

        } else if (beta > 90) {
            if (this.x > mig) {
                alpha = beta - 90 + gamma;
                res = beta - (2 * alpha);

            } else {
                alpha = beta - 90 - gamma;
                res = 90 - gamma - alpha;
            }
            if (res > 90)res = 90;

        } else {
            if (this.x > mig) {
                res = 90 - 2 * gamma;
            } else if (this.x < mig) {
                res = 90 + 2 * gamma
            } else {
                res = 90;
            }
        }

        //eviar horitzontal
        if (res < 10)res = 10;
        if (res > 170)res = 170;

        this.setAngle(res);


        switch (pXoc.vora) {
            case "superior":
                this.vy = -this.vy;
                break;
        }
        dtXoc = (Utilitats.distancia(pXoc.p, trajectoria.p2) / Utilitats.distancia(trajectoria.p1, trajectoria.p2)) * dt;
    }

    for (var i = 0; i < game.mur.totxo.length && !pXoc; i++) {
        if (!game.mur.totxo[i].tocat) {
            pXoc = Utilitats.interseccioSegmentRectangle(trajectoria, {
                p: {x: game.mur.totxo[i].x - this.radi, y: game.mur.totxo[i].y - this.radi},
                w: game.mur.totxo[i].w + 2 * this.radi,
                h: game.mur.totxo[i].h + 2 * this.radi
            });
            if (pXoc) {

                if (game.mur.totxo[i].bonus) {
                    game.powers.power[Utilitats.getRandom(0, game.powers.power.length-1)]();
                }

                game.mur.totxo[i].delete();
                game.audios.sounds[0].currentTime = 0;
                game.audios.sounds[0].play();

                xoc = true;
                this.x = pXoc.p.x;
                this.y = pXoc.p.y;
                switch (pXoc.vora) {
                    case "superior":
                    case "inferior":
                        this.vy = -this.vy;
                        break;
                    case "esquerra":
                    case "dreta"   :
                        this.vx = -this.vx;
                        break;
                }
                dtXoc = (Utilitats.distancia(pXoc.p, trajectoria.p2) / Utilitats.distancia(trajectoria.p1, trajectoria.p2)) * dt;
            }
        }
    }

    // actualitzem la posició de la bola
    if (xoc) {
        this.update(dtXoc);  // crida recursiva
    }
    else {
        this.x = trajectoria.p2.x;
        this.y = trajectoria.p2.y;
    }

};

Ball.prototype.draw = function (ctx) {

    /*ctx.save();
     ctx.fillStyle = this.color;
     ctx.beginPath();
     ctx.arc(this.x, this.y, this.radi, 0, 2 * Math.PI);   // pilota rodona
     ctx.fill();
     ctx.stroke();
     ctx.restore();
     */

    ctx.save();

    var gradient = ctx.createRadialGradient(this.x, this.y, this.radi, this.x - 4, this.y - 4, 0);
    gradient.addColorStop(0, "white");
    gradient.addColorStop(1, "grey");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radi, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

};

Ball.prototype.setAngle = function (angle) {

    this.vx = Math.round(Math.cos(angle * Math.PI / 180) * this.vmax);
    this.vy = Math.round(Math.sin(angle * Math.PI / 180) * this.vmax);
    if (Math.abs(this.vx) == this.vy) {
        this.vy++;
    }

};

Ball.prototype.getAngle = function () {

    if (this.vx > 0) {
        return 90 + Math.acos(this.vy / this.vmax) * 180 / Math.PI;
    } else {
        return Math.asin(this.vy / this.vmax) * 180 / Math.PI;
    }
};

Ball.prototype.getAngle2 = function (dif) {

    return Math.abs(Math.asin(dif / game.paddle.puntCercle.radi) * 180 / Math.PI);

};


///////////////////////////////////    Objecte Totxo

function Totxo(x, y, w, h, color, bonus) {
    this.x = x;
    this.y = y;         // posició, en píxels respecte el canvas
    this.w = w;
    this.h = h;         // mides
    this.color = color;
    this.bonus = bonus;
    this.tocat = false;
}

Totxo.prototype.draw = function (ctx) {

    if(this.bonus){
        ctx.save();
        var grd = ctx.createLinearGradient(this.x, this.y, this.x, this.h);
        var col = this.color;
        grd.addColorStop(0, "black");
        grd.addColorStop(0.5, "white");
        grd.addColorStop(1, "black");
        ctx.fillStyle = grd;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = "#333";
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }else{
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = "#333";
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }

};

Totxo.prototype.delete = function () {
    this.tocat = true;
    game.display.marcador += 10;
    $(".marcador").text(game.display.marcador);
    var self = this;
    this.interval = setInterval(function () {
        Totxo.reduccio(self);
    }, 50);
};

Totxo.reduccio = function (self) {
    self.x += 1;
    self.w -= 2;
    if (self.x % 2 == 0) {
        self.y += 1;
        self.h -= 2;
    }
    if (self.w <= 0) {
        game.mur.totxo.splice(game.mur.totxo.indexOf(self), 1);
        clearTimeout(self.interval);
    }
};


///////////////////////////////////     Utilitats

var Utilitats = {};

Utilitats.esTallen = function (p1, p2, p3, p4) {
    function check(p1, p2, p3) {
        return (p2.y - p1.y) * (p3.x - p1.x) < (p3.y - p1.y) * (p2.x - p1.x);
    }

    return check(p1, p2, p3) != check(p1, p2, p4) && check(p1, p3, p4) != check(p2, p3, p4);
};

Utilitats.puntInterseccio2 = function (p1, p2, p3, p4) {
    var A1, B1, C1, A2, B2, C2, x, y, d;
    if (Utilitats.esTallen(p1, p2, p3, p4)) {
        A1 = p2.y - p1.y;
        B1 = p1.x - p2.x;
        C1 = p1.x * p2.y - p2.x * p1.y;
        A2 = p4.y - p3.y;
        B2 = p3.x - p4.x;
        C2 = p3.x * p4.y - p4.x * p3.y;
        d = A1 * B2 - A2 * B1;
        if (d != 0) {
            x = (C1 * B2 - C2 * B1) / d;
            y = (A1 * C2 - A2 * C1) / d;
            return {x: x, y: y};
        }
    }
};

Utilitats.puntInterseccio = function (p1, p2, p3, p4) {
    // converteix segment1 a la forma general de recta: Ax+By = C
    var a1 = p2.y - p1.y;
    var b1 = p1.x - p2.x;
    var c1 = a1 * p1.x + b1 * p1.y;

    // converteix segment2 a la forma general de recta: Ax+By = C
    var a2 = p4.y - p3.y;
    var b2 = p3.x - p4.x;
    var c2 = a2 * p3.x + b2 * p3.y;

    // calculem el punt intersecció
    var d = a1 * b2 - a2 * b1;

    // línies paral·leles quan d és 0
    if (d == 0) {
        return false;
    }
    else {
        var x = (b2 * c1 - b1 * c2) / d;
        var y = (a1 * c2 - a2 * c1) / d;
        var puntInterseccio = {x: x, y: y};	// aquest punt pertany a les dues rectes
        if (Utilitats.contePunt(p1, p2, puntInterseccio) && Utilitats.contePunt(p3, p4, puntInterseccio))
            return puntInterseccio;
    }
};

Utilitats.contePunt = function (p1, p2, punt) {

    return (valorDinsInterval(p1.x, punt.x, p2.x) || valorDinsInterval(p1.y, punt.y, p2.y));

    // funció interna
    function valorDinsInterval(a, b, c) {
        // retorna cert si b està entre a i b, ambdos exclosos
        if (Math.abs(a - b) < 0.000001 || Math.abs(b - c) < 0.000001) { // no podem fer a==b amb valors reals!!
            return false;
        }
        return (a < b && b < c) || (c < b && b < a);
    }
};

Utilitats.distancia = function (p1, p2) {
    return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
};

Utilitats.interseccioSegmentRectangle = function (seg, rect) {

    // seg={p1:{x:,y:},p2:{x:,y:}}
    // rect={p:{x:,y:},w:,h:}

    var pI, dI, pImin, dImin = Infinity, vora;

    // vora superior
    pI = Utilitats.puntInterseccio(seg.p1, seg.p2,
        {x: rect.p.x, y: rect.p.y}, {x: rect.p.x + rect.w, y: rect.p.y});

    if (pI) {
        dI = Utilitats.distancia(seg.p1, pI);
        if (dI < dImin) {
            dImin = dI;
            pImin = pI;
            vora = "superior";
        }
    }
    // vora inferior
    pI = Utilitats.puntInterseccio(seg.p1, seg.p2,
        {x: rect.p.x + rect.w, y: rect.p.y + rect.h}, {x: rect.p.x, y: rect.p.y + rect.h});
    if (pI) {
        dI = Utilitats.distancia(seg.p1, pI);
        if (dI < dImin) {
            dImin = dI;
            pImin = pI;
            vora = "inferior";
        }
    }

    // vora esquerra
    pI = Utilitats.puntInterseccio(seg.p1, seg.p2,
        {x: rect.p.x, y: rect.p.y + rect.h}, {x: rect.p.x, y: rect.p.y});
    if (pI) {
        dI = Utilitats.distancia(seg.p1, pI);
        if (dI < dImin) {
            dImin = dI;
            pImin = pI;
            vora = "esquerra";
        }
    }

    // vora dreta
    pI = Utilitats.puntInterseccio(seg.p1, seg.p2,
        {x: rect.p.x + rect.w, y: rect.p.y}, {x: rect.p.x + rect.w, y: rect.p.y + rect.h});
    if (pI) {
        dI = Utilitats.distancia(seg.p1, pI);
        if (dI < dImin) {
            dImin = dI;
            pImin = pI;
            vora = "dreta";
        }
    }

    if (vora) {
        return {p: pImin, vora: vora}
    }

};

Utilitats.getRandom = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

Utilitats.getX = function (oElement) {
    var iReturnValue = 0;
    while (oElement != null) {
        iReturnValue += oElement.offsetLeft;
        oElement = oElement.offsetParent;
    }
    return iReturnValue;
};

Utilitats.getY = function (oElement) {
    var iReturnValue = 0;
    while (oElement != null) {
        iReturnValue += oElement.offsetTop;
        oElement = oElement.offsetParent;
    }
    return iReturnValue;
};


///////////////////////////////////     Utilitats

function Audios() {

    this.soundMusic = false;

    this.music = [new Audio('media/music0.mp3'), new Audio("media/music1.mp3"), new Audio("media/music2.mp3")];


    for (var i = 0; i < this.music.length - 1; i++) {
        this.music[i].addEventListener('canplaythrough', Audios.nextMusic(this));
    }

    this.sounds = [new Audio("media/sonido0.mp3")];

    this.currentAudio = Utilitats.getRandom(0, this.music.length - 1);

    this.music[this.currentAudio].addEventListener("load", this.playMusic(this.currentAudio));
}

Audios.prototype.playMusic = function (ra) {
    var ra = ra || Utilitats.getRandom(0, this.music.length - 1);
    this.soundMusic = true;
    $("#laudio").css("display", "none");
    $("#haudio").css("display", "inline-block");
    this.currentAudio = ra;
    this.music[this.currentAudio].play();
};

Audios.prototype.stopMusic = function () {
    this.soundMusic = false;
    $("#laudio").css("display", "inline-block");
    $("#haudio").css("display", "none");
    this.music[this.currentAudio].pause();
    this.music[this.currentAudio].currentTime = 0;
};

Audios.nextMusic = function (that) {
    if (that.currentAudio) {
        console.log("next-track");
        if (that.currentAudio == that.music.length - 1) {
            that.currentAudio = 0;
        } else {
            that.currentAudio++;
        }
        that.music[that.currentAudio].play();
    }

};


///////////////////////////////////     PowerUp

function PowerUps(){

    this.power =  [];

    this.power.push(function () {
        game.paddle.width = 300;
        setTimeout(function () {
            game.paddle.width = 200;
        }, 10000);
    });

    this.power.push(function () {
        game.paddle.width = 100;
        setTimeout(function () {
            game.paddle.width = 200;
        }, 10000);
    });

    this.power.push(function () {
        game.display.vidaExtra();
    });

    this.power.push(function () {
        game.ball.radi = 20;
        setTimeout(function () {
            game.ball.radi = 10;
        },10000);
    });

    this.power.push(function () {
        game.ball.radi = 5;
        setTimeout(function () {
            game.ball.radi = 10;
        },10000);
    });
/*
    this.power.push(function () {
        game.ball.stop = true;
    });
    */
}