function Data () {
  this.canvasSize = 600;
  this.rows = 80;
  this.field = [this.rows]; // 1:пустая земля, 2:хищники, 3:жертвы

  // заполнение поля
  for (let i = 0; i < this.rows; i++) {
    this.field[i] = [this.rows];
  }

  this.predatorsPercentage = 0.02;
  this.preyPercentage = 0.2;

  this.predatorDeathCoef = 0.02;
  this.predatorBirthCoef = 0.9;
  this.preyDeathCoef = 0.01;
  this.preyBirthCoef = 0.04;

  this.speed = 10; // в мс

  this.predatorImage = new Image();
  this.preyImage = new Image();
  this.predatorImage.src = 'predator.png';
  this.preyImage.src = 'prey.png';

  this.predatorNum = 0;
  this.preyNum = 0;

  this.graphPredator = [this.canvasSize];
  this.graphPrey = [this.canvasSize];
  for (let i = 0; i < this.canvasSize; i++) {
    this.graphPredator[i] = 0;
    this.graphPrey[i] = 0;
  }
  this.gIndex = 0;
  this.gUpdate = 0;
  this.nbBox = this.rows * this.rows;

  this.clear;
}

// 1. Данные
const data = new Data();

// 2. Инициализация
function chooseState () {
  const chances = Math.random();
  let state = 1;
  if (chances < data.predatorsPercentage) {
    state = 2; // хищник
    data.predatorNum++;
  } else if (chances < data.predatorsPercentage + data.preyPercentage) {
    state = 3; // жертва
    data.preyNum++;
  }
  return state;
}

function start () {
  if (data.clear !== undefined) {
    clearTimeout(data.clear);
  }

  // проверяем изменение данных
  data.predatorsPercentage = Number(
    document.getElementById('predatorsPercentage').textContent
  );
  data.preyPercentage = Number(
    document.getElementById('preyPercentage').textContent
  );
  data.predatorDeathCoef = Number(
    document.getElementById('predatorDeathCoef').textContent
  );
  data.predatorBirthCoef = Number(
    document.getElementById('predatorBirthCoef').textContent
  );
  data.preyDeathCoef = Number(
      document.getElementById('preyDeathCoef').textContent
  );
  data.preyBirthCoef = Number(
    document.getElementById('preyBirthCoef').textContent
  );
  data.speed = Number(document.getElementById('speed').textContent);

  const canvas = document.getElementById('can');

  canvas.width = data.canvasSize;
  canvas.height = data.canvasSize;

  const cx = canvas.getContext('2d');

  cx.fillStyle = 'black';
  cx.fillRect(0, 0, canvas.width, canvas.height);

  // инициализируем поле
  data.predatorNum = 0;
  data.preyNum = 0;

  for (let i = 0; i < data.rows; i++) {
    // заполняем поле
    for (let j = 0; j < data.rows; j++) {
      // рандомно получаем пустые ячейки, хищников и жертв
      data.field[i][j] = chooseState();
    }
  }

  launch(cx);
}

// 3. Основная логика
function launch (cx) {
  // обновлям canvas
  paintDots(cx);

  for (let i = 0; i < data.rows; i++) {
    for (let j = 0; j < data.rows; j++) {
      const point = data.field[i][j];

      if (point === 1) {
        continue; // пустая ячейка (свободная земля)
      }

      // if (Math.random() > 0.5) {
      //   continue;
      // }

      const neighbourX = Math.ceil(Math.random() * 3) - 2;
      let neighbourY;

      if (neighbourX !== 0) {
        neighbourY = Math.ceil(Math.random() * 3) - 2;
      } else {
        neighbourY = Math.random() > 0.5 ? 1 : -1;
      }

      let otherX = i + neighbourX;
      let otherY = j + neighbourY;

      if (otherX < 0) {
        otherX = data.rows - 1;
      } else if (otherX >= data.rows) {
        otherX = 0;
      }
      if (otherY < 0) {
        otherY = data.rows - 1;
      } else if (otherY >= data.rows) {
        otherY = 0;
      }

      const other = data.field[otherX][otherY];
      const delta1 = point + other; // сохраняем кол-во обитателей

      if (point === 2) { // хищник
        if (other === 3) { // наткнулся на жертву
          if (Math.random() > data.predatorBirthCoef) { // !!проверка прохождение коэффициента размножения хищников
            data.field[otherX][otherY] = 1; // хищник просто убивает жертву, остаётся пустое поле
          } else {
            data.field[otherX][otherY] = 2; // хищник поедает жертву и рождает потомство
          }
        } else if (Math.random() < data.predatorDeathCoef) { // !!проверка прохождения коэффициента убыли хищников
          data.field[i][j] = 1; // хищник не нашёл жертву и умер
        } else if (other === 1) {
          data.field[i][j] = 1;
          data.field[otherX][otherY] = 2; // хищник переместился на пустую ячейку
        }
      } else if (point === 3) { // жертва
        if (other === 2) { // наткнулась на хищника
          if (Math.random() > data.preyDeathCoef) { // !!проверка прохождения коэффциента убийства жертв
            data.field[i][j] = 1; // хищник убивает жертву
          }
        } else if (other === 1) { // если соседняя ячейка пустая
          if (Math.random() < data.preyBirthCoef) { // !!проверка прохождения коэффициента размножения жертв
            data.field[otherX][otherY] = 3; // жертва рождает потомство
          } else {
            data.field[i][j] = 1;
            data.field[otherX][otherY] = 3; // жертва переместилась на пустую ячейку
          }
        }
      }

      // сохраняем кол-во обитателей
      const delta = data.field[i][j] + data.field[otherX][otherY] - delta1;

      if (delta === -1) {
        if (delta1 < 5) data.predatorNum--; // голод
        else {
          data.predatorNum++;
          data.preyNum--;
        }
      } else if (delta === -2) data.preyNum--;
      else if (delta === 2) data.preyNum++;
    }
  }
  if (++data.gUpdate % 7 === 0) {
    data.graphPredator[data.gIndex] = data.predatorNum;
    data.graphPrey[data.gIndex++] = data.preyNum;
    data.gIndex %= data.canvasSize;
    data.gUpdate = 0;
  }
  data.clear = setTimeout(launch, data.speed, cx);
}

// 4. Визуализация
function paintDots (cx) {
  cx.canvas.width = data.canvasSize; // clear.

  // популяция хищников
  cx.strokeStyle = 'red';
  cx.beginPath();

  cx.moveTo(
    0,
    data.canvasSize -
      (data.graphPredator[data.gIndex] * data.canvasSize) / data.nbBox
  );
  for (let i = 1; i < data.canvasSize; i++) {
    cx.lineTo(
      i,
      data.canvasSize -
        (data.graphPredator[(data.gIndex + i) % data.canvasSize] *
          data.canvasSize) /
          data.nbBox
    );
  }
  cx.stroke();

  // популяция жертв
  cx.strokeStyle = 'blue';
  cx.beginPath();
  cx.moveTo(
    0,
    data.canvasSize -
      (data.graphPrey[data.gIndex] * data.canvasSize) / data.nbBox
  );
  for (let i = 1; i < data.canvasSize; i++) {
    cx.lineTo(
      i,
      data.canvasSize -
        (data.graphPrey[(data.gIndex + i) % data.canvasSize] *
          data.canvasSize) /
          data.nbBox
    );
  }
  cx.stroke();

  // визуализация поведенческой модели
  const box = data.canvasSize / data.rows;

  for (let i = 0; i < data.rows; i++) {
    for (let j = 0; j < data.rows; j++) {
      const point = data.field[i][j];
      if (point !== 1) {
        cx.drawImage(
          point === 2 ? data.predatorImage : data.preyImage,
          box * i,
          box * j,
          box,
          box
        );
      }
    }
  }

  cx.save();
}
