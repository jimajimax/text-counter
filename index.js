// #region const
    const textarea = document.getElementById("textInput");
    const textContainer = document.getElementById("textContainer");
    const charWithSpaces = document.getElementById("charWithSpaces");
    const charWithoutSpaces = document.getElementById("charWithoutSpaces");
    const lineCount = document.getElementById("lineCount");
    const paragraphCount = document.getElementById("paragraphCount");
    const pageCount = document.getElementById("pageCount");
    const savedTimeBox = document.getElementById("savedTimeBox");
    const download = document.getElementById("download");
    const downloadState = document.getElementById("downloadState");
    const upload = document.getElementById("upload");
    const clear = document.getElementById("clear");
    const clearState = document.getElementById("clearState");
    const copy = document.getElementById("copy");
    const copyState = document.getElementById("copyState");
    const pipactive = document.getElementById("pipactive");
    const pipState = document.getElementById("pipState");
// #endregion
// #region count
    // テキストエリアの入力を処理
    function updateStats() {
      // Segmenter
      const segmenter = new Intl.Segmenter("ja-JP", { granularity: "grapheme" });
      const text = textarea.value;

      // 文字数カウント（スペース込み）
      charWithSpaces.textContent = Array.from(segmenter.segment(text)).length;

      // 文字数カウント（スペースなし）
      charWithoutSpaces.textContent = Array.from(segmenter.segment(text.replace(/\s/g, ""))).length;

      // 行数カウント
      lineCount.textContent = text.split("\n").length;

      // 段落数カウント（空白行で分ける）
      paragraphCount.textContent = text.trim() === "" ? 0 : text.trim().split(/\n\s*\n/).length;

      // 原稿用紙換算（スペースを除いた文字数を400で割る）
      pageCount.textContent = Math.ceil(Array.from(segmenter.segment(text.replace(/\s/g, ""))).length / 400);

      localStorage.setItem("text-counter_text", text);

      if (text.length === 0) {
        deleteSave()
      }
    }
// #endregion
// #region timestamp
    function timestamp() {
      const date = new Date();
      const nowYear = date.getFullYear();
      const nowMonth = String(date.getMonth() + 1).padStart(2, "0");
      const nowDate = String(date.getDate()).padStart(2, "0");
      const nowHour = String(date.getHours()).padStart(2, "0");
      const nowMin = String(date.getMinutes()).padStart(2, "0");
      const nowSec = String(date.getSeconds()).padStart(2, "0");

      const formattedDate = nowYear + "-" + nowMonth + "-" + nowDate + "  " + nowHour + ":" + nowMin + ":" + nowSec;

      savedTimeBox.textContent = "保存時刻: " + formattedDate;
      localStorage.setItem("text-counter_savedTime", formattedDate);
    }
// #endregion
// #region execute function
    // テキストエリアの内容が変更されたら関数を実行
    textarea.addEventListener("input", () => {
      updateStats();
      timestamp();
    });
// #endregion
// #region restoration
    window.addEventListener("load", () => {
      const getSavedTime = localStorage.getItem("text-counter_savedTime");
      if (getSavedTime == null) {
        savedTimeBox.textContent = "保存時刻: (保存していません)";
      } else {
        savedTimeBox.textContent = "保存時刻: " + getSavedTime;
      }

      const savedText = localStorage.getItem("text-counter_text");
      if (savedText) {
        textarea.value = savedText;
        updateStats();
      }
    });
// #endregion
// #region delete
    function deleteSave() {
      setTimeout(() => {
        localStorage.removeItem("text-counter_text");
        localStorage.removeItem("text-counter_savedTime");
        savedTimeBox.textContent = "保存時刻: (保存していません)";
        lineCount.textContent = "0";
        upload.value = "";
      }, 1);
    }
// #endregion
// #region Picture-in-Picture
    const pipButton = document.getElementById("pipBtn");
    let pipWindow = null;
    let pipContainer = null;

    if ("documentPictureInPicture" in window) {
      // document PiP APIが利用可能な場合の処理

      // openの処理
      async function OpenPiP() {
        const player = document.querySelector("#textContainer");
        pipContainer = player.parentNode;

        pipWindow = await documentPictureInPicture.requestWindow({
          width: 400,
          height: 430
        });

        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
            const style = document.createElement("style");

            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement("link");

            link.rel = "stylesheet";
            link.type = styleSheet.type;
            link.media = styleSheet.media;
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        });

        pipWindow.document.body.append(player);
        pipactive.style.display = "block";
        document.title = "字数カウント | PiP";
        pipState.textContent = "Picture-in-Pictureを閉じる";
        textarea.style.height = "140px";
        textContainer.style.margin = "30px";

        // PiPウインドウ上の×を押された時のClose処理
        pipWindow.addEventListener("unload", ClosePiP.bind(pipWindow), {
          once: true
        });
      }

      // closeの処理
      function ClosePiP() {
        if (this !== pipWindow) {
          return;
        }
        const player = pipWindow.document.querySelector("#textContainer");
        pipContainer.append(player);
        pipWindow.close();
        pipactive.style.display = "none";
        document.title = "文字数カウントツール";
        pipState.textContent = "Picture-in-Pictureで表示";
        textarea.style.height = "250px";
        textContainer.style.margin = "0";

        pipWindow = null;
        pipContainer = null;
      }

      // クリックで実行
      pipButton.addEventListener("click", () => {
        if (!pipWindow) {
          OpenPiP();
        } else {
          ClosePiP.bind(pipWindow)();
        }
      });

      pipactive.addEventListener("click", () => {
        ClosePiP.bind(pipWindow)();
      });

    } else {
      // PiP API 利用不可能な場合の処理
      pipButton.addEventListener("click", () => {
        alert("Sorry...🙏\nこのデバイスまたはこの環境ではPiP表示にできないみたい😭");
        pipState.innerHTML = "<strike>Picture-in-Pictureで表示</strike>";
        pipState.style.fontStyle = "italic";
      });
    }
// #endregion
// #region clear
    clear.addEventListener("click", () => {
      const clearCheck = confirm("クリアしますか？\n一時保存も全て削除されます");
      if (clearCheck) {
        textarea.value = "";
        updateStats()
        clearState.style.color = "#f66";
        clearState.textContent = "クリアしました";
        setTimeout(() => {
          clearState.style.color = "#eee";
          clearState.textContent = "クリアする";
        }, 1500);
      } else {
        clearState.style.color = "#f66";
        clearState.textContent = "キャンセルしました";
        setTimeout(() => {
          clearState.style.color = "#eee";
          clearState.textContent = "クリアする";
        }, 1500);
      }
    });
// #endregion
// #region copy
    // クリップボードにコピー
    copy.addEventListener("click", () => {
      const textToCopy = textarea.value;

      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          copyState.textContent = "コピーしました";
          copyState.style.color = "#f66";
          setTimeout(() => {
            copyState.style.color = "#eee";
            copyState.textContent = "クリップボードにコピー";
          }, 1500);
        })
        .catch(() => {
          copyState.textContent = "コピーできませんでした...";
          copyState.style.color = "#f66";
          setTimeout(() => {
            copyState.style.color = "#eee";
            copyState.textContent = "クリップボードにコピー";
          }, 1500);
        });
    });
// #endregion
// #region download
    download.addEventListener("click", () => {
      const text = textarea.value;

      // ファイル名をユーザーに入力させる
      let fileName = prompt("ファイル名、拡張子を入力してください\n(.txt .html .css .js .json .md .xml .csvなど)");

      // キャンセルされた場合は処理を中断
      if (fileName === null) {
        downloadState.textContent = "キャンセルしました";
        downloadState.style.color = "#f66";
        setTimeout(() => {
          downloadState.style.color = "#eee";
          downloadState.textContent = "入力内容をデバイスに保存";
        }, 1500);
        return;
      }

      // 空文字の場合のデフォルト名
      if (fileName === "") {
        fileName = "untitled.txt";
      }

      const blob = new Blob([text]);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
    });
// #endregion
// #region upload
    upload.addEventListener("change", (event) => {
      function uploadTextFile(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          textarea.value = e.target.result;
          updateStats();
        };
        reader.readAsText(file);
      }
      timestamp()
      // uploadTextFileを実行
      uploadTextFile(event);
    });
// #endregion
