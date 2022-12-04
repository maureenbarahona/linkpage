let recalcLastCall = 0;

let recalcTimeout = 0;

recalc();

window.addEventListener("resize", recalc);

function recalc() {
  if (Date.now() - recalcLastCall < 1000) {
    if (recalcTimeout) return;

    return (recalcTimeout = setTimeout(() => {
      recalcTimeout = 0;
      recalc();
    }, 1000 - (Date.now() - recalcLastCall)));
  }

  recalcLastCall = Date.now();

  let farStars = genShadow(200);
  let midStars = genShadow(100);
  let nearStars = genShadow(50);

  document.querySelector("#style").innerHTML = `
    .far-stars { box-shadow: ${farStars}; }
    .mid-stars { box-shadow: ${midStars}; }
    .near-stars { box-shadow: ${nearStars}; }
    .far-stars::after { box-shadow: ${farStars}; }
    .mid-stars::after { box-shadow: ${midStars}; }
    .near-stars::after { box-shadow: ${nearStars}; }`;

  function genShadow(count) {
    let width = window.innerWidth;
    let height = window.innerHeight;

    let stars = [];

    for (let i = 0; i < count; i++) {
      let x = ~~(width * Math.random());
      let y = ~~(height * Math.random());

      let opacity = ~~(8 * Math.random()) + 8;

      stars.push(`${x}px ${y}px #fff${opacity.toString(16)}`);
    }

    return stars.join(",");
  }
}
