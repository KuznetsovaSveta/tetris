const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const canvasScore = document.getElementById('score');
const contextScore = canvasScore.getContext('2d');
//размер клеточки
const grid = 32;
//массив с последовательностями фигур, на старте - пустой
var tetrominoSequence = [];
// с помощью двумерного массива следим за тем, что находится в каждой клетке игрового поля
// размер поля — 10 на 20, и несколько строк ещё находится за видимой областью
var playfield = [];
let score = 0;
let record = 0;
//текущий уровень сложности
let level = 1;
//имя рекордсмена
let recordName = '';
name = prompt("Ваше имя", "");
// Узнаём размер хранилища
var Storage_size = localStorage.length;
// Если в хранилище уже что-то есть…
// if (Storage_size > 0) {
    // …то достаём оттуда значение рекорда и имя чемпиона
    record = localStorage.record;
    recordName = localStorage.recordName;
// }


//сразу заполняем массив пустыми ячейками
for(let row = -2; row < 20; row++){
    playfield[row] = [];

    for(let col = 0; col < 10; col++){
        playfield[row][col] = 0;
    }
}

//задаем форму для каждой фигуры:
const tetrominos = {
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    'J': [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    'L': [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
    ],
    'O': [
        [1, 1],
        [1, 1],
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
    'T': [
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0],
    ],
};

const colors = {
    'I': '#6DB9F8',
    'O': '#FFE433',
    'T': '#E393F8',
    'S': '#B6D874',
    'Z': '#FF4D85',
    'J': '#FFB580',
    'L': '#F47C71',
}

//счетчик
let count = 0;
//текущая фигура в игре
let tetromino = getNextTetromino();
//следим за кадрами анимации, чтобы если что - остановить игру
let rAF = null;
//флаг конца игры, на старте - неактивный
let gameOver = false;

//для генерации выпадающих фигур используем случайное число
//в зависимости от числа будем выбирать фигуру
function getRandomInt(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1) + min)
}

//создаем последовательность фигур
function generateSequence(){
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

    while(sequence.length){
        //случайным образом получаем индекс
        const rand = getRandomInt(0, sequence.length-1);
        //по случайному индексу получаем фигуру
        const name = sequence.splice(rand, 1)[0];
        //полученную фигуру помещаем в массив с последовательностью
        tetrominoSequence.push(name);
    }
}

//получаем следующую фигуру
function getNextTetromino(){
//    если следующей нет - генерируем
    if(tetrominoSequence.length === 0){
        generateSequence();
    }

//    берем первую фигуру из массива
    const name = tetrominoSequence.pop();
//    создаем матрицу, с которой мы отрисуем фигуру
    const matrix = tetrominos[name];
    //фигуры должны выпадать из середины поля
    //I и O с середины поля, остальные - чуть левее
    const col = playfield[0].length / 2 - Math.ceil(matrix[0].length/2);
    // I начинает с 21 строки (смещение -1), а все остальные — со строки 22 (смещение -2)
    const row = name === 'I' ? -1 : -2;

    return{
        name: name,//название фигуры
        matrix: matrix, //матрица с фигурой
        row: row,//текущая строка
        col: col,//текущий столбец
    };
}

//функция для поворота фигуры на 90 градусов
//для этого поворачиваем саму матрицу
function rotate(matrix){
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i]));
    //возвращаем перевернутую матрицу
    return result;
}

//после появления или вращения проверяем, не выйдет ли фигура за пределы поля
function isValidMove(matrix, cellRow, cellCol) {
//    проверяем все строки и столбцы
    for(let row = 0; row < matrix.length; row++){
        for(let col = 0; col < matrix[row].length; col++){
            if(matrix[row][col] && (
                //если выходят за границы поля
                cellCol + col < 0 ||
                    cellCol + col >= playfield[0].length ||
                    cellRow + row >= playfield.length ||
                    //или если пересекается с другими фигурами
                    playfield[cellRow + row][cellCol + col])
            ){
                return false;
            }
        }
    }
    return true;
}

//когда фигура окончательно встала на свое место
function placeTetromino(){
//    проверяем все строки и столбцы
    for (let row = 0; row < tetromino.matrix.length; row++){
        for (let col = 0; col < tetromino.matrix[row].length; col++){
            if(tetromino.matrix[row][col]){
            //    если после установки часть фигуры выходит за пределы поля
                if (tetromino.row + row < 0){
                    return showGameOver();
                }
            //    иначе записываем в массив игрового поля нашу фигуру
                playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
            }
        }
    }

    for(let row = playfield.length - 1; row >= 0; ){
        //если ряд заполнен
        if(playfield[row].every(cell => !!cell)){
            score += 10;
            level = Math.floor(score/100) + 1;
            // если игрок побил прошлый рекорд
            if (score > record) {
                // ставим его очки как рекорд
                record = score;
                //сохраняем рекорд
                localStorage.record = record;
                // меняем имя чемпиона
                recordName = name;
            //    заносим в хранилище его имя
                localStorage.recordName = recordName;
            }
        //    очищаем ряд и опускаем все вниз на одну строку
            for (let r = row; r >= 0; r--){
                for (let c = 0; c < playfield[r].length; c++){
                    playfield[r][c] = playfield[r-1][c];
                }
            }
        }
        else {
            //проверяем следующий ряд
            row--;
        }
    }
    //получаем следующую фигуру
    tetromino = getNextTetromino();
}
function playGame(){
    rAF = requestAnimationFrame(loop);
}
function pauseGame(){
    cancelAnimationFrame(rAF);
    context.fillStyle = 'black';
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 -30, canvas.width,60);
    context.globalAlpha = 1;
    context.fillStyle = 'white';
    context.font = '36px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('PAUSE', canvas.width / 2, canvas.height / 2);

    if(gameOver !== true){
        document.addEventListener('keydown', function(e){
            if((e.which === 27) || (e.which === 32)){
                playGame();
            }
        });
    }
}

//при окончании игры
function showGameOver(){
//    прекращаем анимацию
    cancelAnimationFrame(rAF);
//    ставим флаг окончания
    gameOver = true;
//    поверх поля рисуем попап
    context.fillStyle = 'black';
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 -30, canvas.width,60);
    context.globalAlpha = 1;
    context.fillStyle = 'white';
    context.font = '36px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
}

//отслеживаем нажатия на клавиши
document.addEventListener('keydown', function(e){
//    если игра закончилась - выходим
    if(gameOver) return;

//    при клике на стрелки вправо и влево
    if(e.which === 37 || e.which === 39){
        const col = e.which === 37 ? tetromino.col - 1 :tetromino.col + 1;

    //    если так ходить можно, запоминаем текущее положение
        if(isValidMove(tetromino.matrix, tetromino.row, col)){
            tetromino.col = col;
        }
    }

//    стрелка вверх - поворачиваем фигуру
    if(e.which === 38){
        //вызываем функцию поворота фигуры
        const matrix = rotate(tetromino.matrix);
        //    если так ходить можно, запоминаем текущее положение
        if(isValidMove(matrix, tetromino.row, tetromino.col)){
            tetromino.matrix = matrix;
        }
    }
//    стрелка вниз - ускоряем падение
    if(e.which === 40){
    //    смещаем фигуру на строку вниз
        const row = tetromino.row + 1;
    //    если спускаться больше некуда - запоминаем положение
        if(!isValidMove(tetromino.matrix, row, tetromino.col)){
            tetromino.row = row - 1;
        //    ставим на место и проверяем заполненные ряды
            placeTetromino();
            return;
        }
        //запоминаем строку, на которую встала фигура
        tetromino.row = row;
    }
//    esc - пауза
    if(e.which === 27){
        pauseGame();
    }
})

//главный цикл игры
function loop(){
    //начинаем анимацию
    rAF = requestAnimationFrame(loop);
//    очищаем холст
    context.clearRect(0,0, canvas.width, canvas.height);

//    рисуем игровое поле с учетом заполненных фигур
    for (let row = 0; row < 20; row++){
        for(let col = 0; col < 10; col++){
            if(playfield[row][col]){
                const name = playfield[row][col];
                context.fillStyle = colors[name];

            //    рисуем все на 1px меньше для получения эффекта клетки
                context.fillRect(col * grid, row * grid, grid-1, grid-1);
            }
        }
    }
//вывод статистики
    function showScore(){
        contextScore.clearRect(0,0, canvasScore.width, canvasScore.height);
        contextScore.globalAlpha = 1;
        contextScore.fillStyle = 'white';
        contextScore.font = '18px Courier New';
        contextScore.fillText('Уровень: ' + level, 15, 20);
        contextScore.fillText('Очков: ' + score, 15, 50);
        contextScore.fillText('Чемпион: ' + recordName, 160, 20);
        contextScore.fillText('Рекорд: ' + record, 160, 50);
    }
//    рисуем текущую фигуру
    if(tetromino){
    //    фигура сдвигается вниз каждые 35 кадров
        if (++count > (36 - level)){
            tetromino.row++;
            count = 0;

        //    если движение закончилось - рисуем фигуру в поле и проверяем заполненность ряда
            if(!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)){
                tetromino.row--;
                placeTetromino();
            }
        }

        //раскрашиваем фигуру
        context.fillStyle = colors[tetromino.name];

    //    отрисовываем ее
        for(let row = 0; row < tetromino.matrix.length; row++){
            for(let col = 0; col < tetromino.matrix[row].length; col++){
                if (tetromino.matrix[row][col]){
                //    рисуем на 1px меньше
                    context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
                }
            }
        }
    }
    showScore();
}
//старт игры
rAF = requestAnimationFrame(loop);



