let bold = document.querySelectorAll(".font button")[0];
let italic = document.querySelectorAll(".font button")[1];
let underline = document.querySelectorAll(".font button")[2];
let  alignLeft = document.querySelectorAll(".align button")[0];
let alignCenter = document.querySelectorAll(".align button")[1];
let alignRight = document.querySelectorAll(".align button")[2];
let alignJustify = document.querySelectorAll(".align button")[3];
let artBoard = document.querySelector(".artboard");
let bullet=document.getElementById("bullet");
bold.addEventListener("click", function () {
  artBoard.classList.toggle("bold");
  bold.classList.toggle("b");
});

italic.addEventListener("click", function () {
  artBoard.classList.toggle("italic");
  italic.classList.toggle("i");
});

underline.addEventListener("click", function () {
  artBoard.classList.toggle("underline");
  underline.classList.toggle("u");
});

alignLeft.addEventListener("click", function () {
  artBoard.classList.add("alignLeft");
  alignLeft.classList.add("l");
  artBoard.classList.remove("alignCenter");
  alignCenter.classList.remove("c");
  artBoard.classList.remove("alignRight");
  alignRight.classList.remove("r");
  artBoard.classList.remove("alignJustify");
  alignJustify.classList.remove("j");
});

alignCenter.addEventListener("click", function () {
  artBoard.classList.remove("alignLeft");
  alignLeft.classList.remove("l");
  artBoard.classList.add("alignCenter");
  alignCenter.classList.add("c");
  artBoard.classList.remove("alignRight");
  alignRight.classList.remove("r");
  artBoard.classList.remove("alignJustify");
  alignJustify.classList.remove("j");
});

alignRight.addEventListener("click", function () {
  artBoard.classList.remove("alignLeft");
  alignLeft.classList.remove("l");
  artBoard.classList.remove("alignCenter");
  alignCenter.classList.remove("c");
  artBoard.classList.add("alignRight");
  alignRight.classList.add("r");
  artBoard.classList.remove("alignJustify");
  alignJustify.classList.remove("j");
});

alignJustify.addEventListener("click", function () {
  artBoard.classList.remove("alignLeft");
  alignLeft.classList.remove("l");
  artBoard.classList.remove("alignCenter");
  alignCenter.classList.remove("c");
  artBoard.classList.remove("alignRight");
  alignRight.classList.remove("r");
  artBoard.classList.add("alignJustify");
  alignJustify.classList.add("j");
});

function changeFont(font) {
  document.getElementById("font").style.fontFamily = font.value;
}
function TextTransform(textTransform) {
  document.getElementById("font").style.textTransform = textTransform.value;
}
function changetext() {
let input=document.getElementById("InputText").value;
  let artBoardtextcolor=document.getElementById("font");
  let h3 =document.getElementById("h3");
  artBoardtextcolor.style.color=input;
  h3.textContent=input;
}
