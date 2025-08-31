// #region const
    const textarea = document.getElementById("textInput");
    const textContainer = document.getElementById("textContainer");
    const charWithSpaces = document.getElementById("charWithSpaces");
    const charWithoutSpaces = document.getElementById("charWithoutSpaces");
    const lineCount = document.getElementById("lineCount");
    const paragraphCount = document.getElementById("paragraphCount");
    const pageCount = document.getElementById("pageCount");
    const group = document.getElementById("group");
    const undo = document.getElementById("undo");
    const redo = document.getElementById("redo");
    const pipactive = document.getElementById("pipactive");
    const pipButton = document.getElementById("pip");
    const pipState = document.getElementById("pipState");
    const savedTimeBox = document.getElementById("savedTimeBox");
    const clear = document.getElementById("clear");
    const clearState = document.getElementById("clearState");
    const share = document.getElementById("share");
    const shareState = document.getElementById("shareState");
    const copy = document.getElementById("copy");
    const copyState = document.getElementById("copyState");
    const paste = document.getElementById("paste");
    const pasteState = document.getElementById("pasteState");
    const select = document.getElementById("select");
    const selectState = document.getElementById("selectState");
    const replace = document.getElementById("replace");
    const replaceState = document.getElementById("replaceState");
    const download = document.getElementById("download");
    const downloadState = document.getElementById("downloadState");
    const edit = document.getElementById("edit");
    const editState = document.getElementById("editState");
    const editLabel = document.getElementById("editLabel");
    const editSave = document.getElementById("editSave");
    const editSaveState = document.getElementById("editSaveState");
    const editSaveLabel = document.getElementById("editSaveLabel");
    const upload = document.getElementById("upload");
    let uploadAvailable = true;
// #endregion
// #region count
    function updateStats() {
      // Segmenter
      const segmenter = new Intl.Segmenter("ja-JP", { granularity: "grapheme" });
      const text = textarea.value;

      // 文字数カウント（スペース含）
      charWithSpaces.textContent = Array.from(segmenter.segment(text.replace(/\n/g, ""))).length;
      // 文字数カウント（スペース除）
      charWithoutSpaces.textContent = Array.from(segmenter.segment(text.replace(/\s/g, ""))).length;
      // 行数カウント
      lineCount.textContent = text.split("\n").length;
      // 段落数カウント
      paragraphCount.textContent = text.trim().split(/\n\s*\n|(?<=\n)\s+/).filter(group => group.trim() !== "").length;
      // 原稿用紙換算（文字数を400で割る）
      pageCount.textContent = Math.ceil(Array.from(segmenter.segment(text.replace(/\n/g, ""))).length / 400);

      localStorage.setItem("text-counter_text", text);

      if (text.length === 0) {
        localStorage.removeItem("text-counter_text");
        localStorage.removeItem("text-counter_savedTime");
        savedTimeBox.textContent = "保存時刻: (保存していません)";
        lineCount.textContent = "0";
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
    function timeStatsUndoredo() {
      timestamp();
      updateStats();
      undoredo();
    }
    // テキストエリアの内容が変更されたら関数を実行
    textarea.addEventListener("input", () => {
      timeStatsUndoredo();
    });
// #endregion
// #region restoration
    let history = [];
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
        history.push(textarea.value);
        updateStats();
      }
    });
// #endregion
// #region history
    let historyIndex;
    setTimeout(() => {
    }, 500);
    historyIndex = 0; // 配列の何個目の要素を表示しているか (初期値0)

    function undoredo() {
      if (!(textarea.value === history[historyIndex])) {
        if (historyIndex < history.length - 1) {
          history = history.slice(0, historyIndex + 1);
        }
        history.push(textarea.value);
        historyIndex ++;
        undoredoBtn();
      }
    }
    // Undo
    undo.addEventListener("click", () => {
      if (historyIndex > 0) {
        historyIndex --;
        textarea.value = history[historyIndex];
        timestamp();
        updateStats();
        undoredoBtn();
      }
    });
    // Redo
    redo.addEventListener("click", () => {
      if (historyIndex < history.length - 1) {
        historyIndex ++;
        textarea.value = history[historyIndex];
        timestamp();
        updateStats();
        undoredoBtn();
      }
    });
    function undoredoBtn() {
        if (historyIndex == 0) { // 戻れない
          setTimeout(() => {
            undo.classList.remove("redoundoCheck");
            document.querySelector("#undoIcon g").setAttribute("fill", "#777");
          }, 500);
        } else { // 戻れる
          undo.classList.add("redoundoCheck");
          if (!pipWindow) {
            document.querySelector("#undoIcon g").setAttribute("fill", "#eee");
          }
        }

        if (historyIndex >= history.length - 1) { // 進めない
          setTimeout(() => {
            redo.classList.remove("redoundoCheck");
            if (!pipWindow) {
              document.querySelector("#redoIcon g").setAttribute("fill", "#777");
            }
          }, 500);
        } else { // 進める
          redo.classList.add("redoundoCheck");
          document.querySelector("#redoIcon g").setAttribute("fill", "#eee");
        }
    }
    undoredoBtn();
// #endregion
// #region Picture-in-Picture
    let pipWindow = null;
    let pipContainer = null;

    if ("documentPictureInPicture" in window) {
      // document PiP APIが利用可能な場合の処理

      // openの処理
      async function OpenPiP() {
        const player = document.querySelector("#textContainer");
        pipContainer = player.parentNode;

        pipWindow = await documentPictureInPicture.requestWindow({
          width: 300,
          height: 390
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
        pipWindow.document.body.style.height = "0";
        pipactive.style.display = "block";
        group.style.justifyContent = "center";
        document.title = "字数カウント | PiP";
        pipState.classList.remove("fade-left");
        pipState.classList.add("fade-right");
        setTimeout(() => {
          pipState.textContent = "Picture-in-Pictureを閉じる";
          pipState.classList.remove("fade-right");
          pipState.classList.add("fade-left");
        }, 30);
        textarea.style.height = "140px";
        textContainer.style.margin = "10px 20px";
        undo.style.display = "none";
        redo.style.display = "none";

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
        group.style.justifyContent = "space-between";
        document.title = "文字数カウントツール";
        pipState.classList.remove("fade-left");
        pipState.classList.add("fade-right");
        setTimeout(() => {
          pipState.textContent = "Picture-in-Pictureで表示";
          pipState.classList.remove("fade-right");
          pipState.classList.add("fade-left");
        }, 30);
        textarea.style.height = Math.max(innerHeight / 2, 280) + "px";
        textarea.style.width = innerWidth - 6 + "px";
        textContainer.style.margin = "0";
        undo.style.display = "flex";
        redo.style.display = "flex";
        pipWindow = null;
        pipContainer = null;
        undoredoBtn();
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
        alert("Sorry...🙏\nこのデバイスまたはこの環境ではPiP表示にできないみたい😭😭");
        pipState.classList.remove("fade-left");
        pipState.classList.add("fade-right");
        setTimeout(() => {
          pipState.innerHTML = "<strike>Picture-in-Pictureで表示</strike>";
          pipState.style.fontStyle = "italic";
          pipState.classList.remove("fade-right");
          pipState.classList.add("fade-left");
        }, 30);
      });
    }
// #endregion
// #region clear
    clear.addEventListener("click", () => {
      if (!textarea.value.trim()) {
        clearState.classList.remove("fade-left");
        clearState.classList.add("fade-right");
        setTimeout(() => {
          clearState.style.color = "#fd5";
          clearState.textContent = "クリアしました";
          clearState.classList.remove("fade-right");
          clearState.classList.add("fade-left");
        }, 30);
        setTimeout(() => {
          clearState.classList.remove("fade-left");
          clearState.classList.add("fade-right");
          setTimeout(() => {
            clearState.style.color = "";
            clearState.textContent = "入力内容をクリアする";
            clearState.classList.remove("fade-right");
            clearState.classList.add("fade-left");
          }, 30);
        }, 2500);
        return;
      }

      const clearCheck = confirm("クリアしますか？\n保存も全て削除されます\n(Undoボタンから戻せます)");
      clearState.classList.remove("fade-left");
      clearState.classList.add("fade-right");
      if (clearCheck) {
        textarea.value = "";
        updateStats();
        undoredo();
        setTimeout(() => {
          clearState.style.color = "#fd5";
          clearState.textContent = "クリアしました";
          clearState.classList.remove("fade-right");
          clearState.classList.add("fade-left");
        }, 30);
      } else {
        setTimeout(() => {
          clearState.style.color = "#fd5";
          clearState.textContent = "キャンセルしました";
          clearState.classList.remove("fade-right");
          clearState.classList.add("fade-left");
        }, 30);
      }
      setTimeout(() => {
        clearState.classList.remove("fade-left");
        clearState.classList.add("fade-right");
        setTimeout(() => {
          clearState.style.color = "";
          clearState.textContent = "入力内容をクリアする";
          clearState.classList.remove("fade-right");
          clearState.classList.add("fade-left");
        }, 30);
      }, 2500);
    });
// #endregion
// #region share
    share.addEventListener("click", async () => {
      if (navigator.share) {
        if (!textarea.value.trim()) {
          alert("共有する内容を入力してください");
          return;
        }

        try {
          await navigator.share({
            title: "入力内容を共有しよう！！",
            text: textarea.value,
          });

        } catch (err) {
          if (err.name === "AbortError") {
            shareState.classList.remove("fade-left");
            shareState.classList.add("fade-right");
            setTimeout(() => {
              shareState.style.color = "#fd5";
              shareState.textContent = "キャンセルしました";
              shareState.classList.remove("fade-right");
              shareState.classList.add("fade-left");
            }, 30);
            setTimeout(() => {
              shareState.classList.remove("fade-left");
              shareState.classList.add("fade-right");
              setTimeout(() => {
                shareState.style.color = "";
                shareState.textContent = "入力内容を共有する";
                shareState.classList.remove("fade-right");
                shareState.classList.add("fade-left");
              }, 30);
            }, 2500);
          }
        }
      } else {
        alert("共有機能はこのブラウザまたはこの環境で使えないみたい😭😭");
        shareState.classList.remove("fade-left");
        shareState.classList.add("fade-right");
        setTimeout(() => {
          shareState.innerHTML = "<strike>入力内容を共有する</strike>";
          shareState.style.fontStyle = "italic";
          shareState.classList.remove("fade-right");
          shareState.classList.add("fade-left");
        }, 30);
      }
    });
// #endregion
// #region copy
    copy.addEventListener("click", () => {
      const textToCopy = textarea.value;
      if (!textarea.value.trim()) {
        alert("コピーする内容を入力してください");
        return;
      }

      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          copyState.classList.remove("fade-left");
          copyState.classList.add("fade-right");
          setTimeout(() => {
            copyState.style.color = "#fd5";
            copyState.textContent = "コピーしました";
            copyState.classList.remove("fade-right");
            copyState.classList.add("fade-left");
          }, 30);
          setTimeout(() => {
            copyState.classList.remove("fade-left");
            copyState.classList.add("fade-right");
            setTimeout(() => {
              copyState.style.color = "";
              copyState.textContent = "クリップボードにコピー";
              copyState.classList.remove("fade-right");
              copyState.classList.add("fade-left");
            }, 30);
          }, 2500);
        })
        .catch(() => {
          copyState.classList.remove("fade-left");
          copyState.classList.add("fade-right");
          setTimeout(() => {
            copyState.style.color = "#fd5";
            copyState.innerHTML = "コピーできませんでした...<br>手動でお願いします...";
            copyState.classList.remove("fade-right");
            copyState.classList.add("fade-left");
          }, 30);
          setTimeout(() => {
            copyState.classList.remove("fade-left");
            copyState.classList.add("fade-right");
            setTimeout(() => {
              copyState.style.color = "";
              copyState.textContent = "クリップボードにコピー";
              copyState.classList.remove("fade-right");
              copyState.classList.add("fade-left");
            }, 30);
          }, 2500);
        });
    });
// #endregion
// #region paste
    paste.addEventListener("click", () => {
      navigator.clipboard.readText()
        .then((text) => {
          if (text.trim() == "") {
            alert("ペーストする内容がありません");
            return;
          }

          textarea.value = text;
          timeStatsUndoredo();
          pasteState.classList.remove("fade-left");
          pasteState.classList.add("fade-right");
          setTimeout(() => {
            pasteState.style.color = "#fd5";
            pasteState.textContent = "ペーストしました";
            pasteState.classList.remove("fade-right");
            pasteState.classList.add("fade-left");
          }, 30);
          setTimeout(() => {
            pasteState.classList.remove("fade-left");
            pasteState.classList.add("fade-right");
            setTimeout(() => {
              pasteState.style.color = "";
              pasteState.textContent = "クリップボードからペースト";
              pasteState.classList.remove("fade-right");
              pasteState.classList.add("fade-left");
            }, 30);
          }, 2500);
        })
        .catch(() => {
          pasteState.classList.remove("fade-left");
          pasteState.classList.add("fade-right");
          setTimeout(() => {
            pasteState.style.color = "#fd5";
            pasteState.innerHTML = "ペーストできませんでした...<br>手動でお願いします...";
            pasteState.classList.remove("fade-right");
            pasteState.classList.add("fade-left");
          }, 30);
          setTimeout(() => {
            pasteState.classList.remove("fade-left");
            pasteState.classList.add("fade-right");
            setTimeout(() => {
              pasteState.style.color = "";
              pasteState.textContent = "クリップボードからペースト";
              pasteState.classList.remove("fade-right");
              pasteState.classList.add("fade-left");
            }, 30);
          }, 2500);
        });
    });
// #endregion
// #region select
    select.addEventListener("click", () => {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
    })
// #endregion
// #region replace
    replace.addEventListener("click", () => {
      const from = prompt("置換したい文字列を入力してください");
      if (from === null) {
        replaceState.classList.remove("fade-left");
        replaceState.classList.add("fade-right");
        setTimeout(() => {
          replaceState.style.color = "#fd5";
          replaceState.textContent = "キャンセルしました";
          replaceState.classList.remove("fade-right");
          replaceState.classList.add("fade-left");
        }, 30);
        setTimeout(() => {
          replaceState.classList.remove("fade-left");
          replaceState.classList.add("fade-right");
          setTimeout(() => {
            replaceState.style.color = "";
            replaceState.textContent = "入力内容を置換する";
            replaceState.classList.remove("fade-right");
            replaceState.classList.add("fade-left");
          }, 30);
        }, 2500);
        return;
      }
      const to = prompt("置換後の新しい文字列を入力してください\n置換する文字列: " + from);
      if (to === null) {
        replaceState.classList.remove("fade-left");
        replaceState.classList.add("fade-right");
        setTimeout(() => {
          replaceState.style.color = "#fd5";
          replaceState.textContent = "キャンセルしました";
          replaceState.classList.remove("fade-right");
          replaceState.classList.add("fade-left");
        }, 30);
        setTimeout(() => {
          replaceState.classList.remove("fade-left");
          replaceState.classList.add("fade-right");
          setTimeout(() => {
            replaceState.style.color = "";
            replaceState.textContent = "入力内容を置換する";
            replaceState.classList.remove("fade-right");
            replaceState.classList.add("fade-left");
          }, 30);
        }, 2500);
        return;
      }
      const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"); // 特殊文字エスケープ
      textarea.value = textarea.value.replace(regex, to);
      timeStatsUndoredo();
      replaceState.classList.remove("fade-left");
      replaceState.classList.add("fade-right");
      setTimeout(() => {
        replaceState.style.color = "#fd5";
        replaceState.textContent = "置換しました";
        replaceState.classList.remove("fade-right");
        replaceState.classList.add("fade-left");
      }, 30);
      setTimeout(() => {
        replaceState.classList.remove("fade-left");
        replaceState.classList.add("fade-right");
        setTimeout(() => {
          replaceState.style.color = "";
          replaceState.textContent = "入力内容を置換する";
          replaceState.classList.remove("fade-right");
          replaceState.classList.add("fade-left");
        }, 30);
      }, 2500);
    })
// #endregion
// #region download
    download.addEventListener("click", async () => {
      const text = textarea.value;

      // ファイル名をユーザーが入力
      let fileName = prompt("ファイル名と拡張子を入力してください\n(.txt .html .css .js .json .md .xml .csvなど)");

      // キャンセルされた場合は処理を中断
      if (fileName === null) {
        downloadState.classList.remove("fade-left");
        downloadState.classList.add("fade-right");
        setTimeout(() => {
          downloadState.style.color = "#fd5";
          downloadState.textContent = "キャンセルしました";
          downloadState.classList.remove("fade-right");
          downloadState.classList.add("fade-left");
        }, 30);
        setTimeout(() => {
          downloadState.classList.remove("fade-left");
          downloadState.classList.add("fade-right");
          setTimeout(() => {
            downloadState.style.color = "";
            downloadState.textContent = "入力内容をデバイスに新規保存";
            downloadState.classList.remove("fade-right");
            downloadState.classList.add("fade-left");
          }, 30);
        }, 2500);
        return;
      }

      // 空文字の場合のデフォルト名
      if (fileName === "") {
        fileName = "untitled.txt";
      }

      if (!fileName.includes(".")) {
        fileName += ".txt";
      }

      if ("showSaveFilePicker" in window) { // showSaveFilePicker()が利用可能か
        async function saveTextWithPicker() {
          try {
            const fileHandle = await window.showSaveFilePicker({
              suggestedName: fileName
            });

            const writable = await fileHandle.createWritable();
            await writable.write(text);
            await writable.close();

            downloadState.classList.remove("fade-left");
            downloadState.classList.add("fade-right");
            setTimeout(() => {
              downloadState.style.color = "#fd5";
              downloadState.textContent = "新規保存しました";
              downloadState.classList.remove("fade-right");
              downloadState.classList.add("fade-left");
              editSaveLabel.style.display = "none";
              editLabel.style.display = "flex";
            }, 30);

          } catch (err) {
            if (err.name === "AbortError") {
              downloadState.classList.remove("fade-left");
              downloadState.classList.add("fade-right");
              setTimeout(() => {
                downloadState.style.color = "#fd5";
                downloadState.textContent = "キャンセルしました";
                downloadState.classList.remove("fade-right");
                downloadState.classList.add("fade-left");
              }, 30);
            } else {
              downloadState.classList.remove("fade-left");
              downloadState.classList.add("fade-right");
              setTimeout(() => {
                downloadState.style.color = "#fd5";
                downloadState.textContent = "保存できませんでした...";
                console.error("download err", err);
                downloadState.classList.remove("fade-right");
                downloadState.classList.add("fade-left");
                editSaveLabel.style.display = "none";
                editLabel.style.display = "flex";
              }, 30);
            }
          }
          setTimeout(() => {
            downloadState.classList.remove("fade-left");
            downloadState.classList.add("fade-right");
            setTimeout(() => {
              downloadState.style.color = "";
              downloadState.textContent = "入力内容をデバイスに新規保存";
              downloadState.classList.remove("fade-right");
              downloadState.classList.add("fade-left");
            }, 30);
          }, 2500);
        }
        saveTextWithPicker();

      } else {
        const blob = new Blob([text]);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
      }
    });
// #endregion
// #region edit
    let fileHandle = null;
    edit.addEventListener("click", async () => {
      if ("showOpenFilePicker" in window) { //showOpenFilePicker()が利用可能か
        try {
          const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [
              {
                description: "Files (.txt, .html, .htm, .css, .js, .json, .md, .xml, .csv)",
                accept: {
                  "text/plain": [".txt"],
                  "text/html": [".html", ".htm"],
                  "text/css": [".css"],
                  "application/javascript": [".js"],
                  "application/json": [".json"],
                  "text/markdown": [".md"],
                  "application/xml": [".xml"],
                  "text/csv": [".csv"]
                }
              }
            ]
          });

          fileHandle = handle; // ファイルハンドルを保存
          const file = await fileHandle.getFile();
          const text = await file.text();
          textarea.value = text;
          timeStatsUndoredo();

          // 上書き保存ボタンを表示
          editLabel.style.display = "none"; // 開くボタンは隠す
          editSaveLabel.style.display = "flex";
        } catch (err) {
          if (err.name === "AbortError") {
            editState.classList.remove("fade-left");
            editState.classList.add("fade-right");
            setTimeout(() => {
              editState.style.color = "#fd5";
              editState.textContent = "キャンセルしました";
              editState.classList.remove("fade-right");
              editState.classList.add("fade-left");
            }, 30);
          } else {
            editState.textCont
            editState.classList.remove("fade-left");
            editState.classList.add("fade-right");
            setTimeout(() => {
              editState.style.color = "#fd5";
              editState.textContent = "選択できませんでした...";
              editState.classList.remove("fade-right");
              editState.classList.add("fade-left");
            }, 30);
          }
          setTimeout(() => {
            editState.classList.remove("fade-left");
            editState.classList.add("fade-right");
            setTimeout(() => {
              editState.style.color = "";
              editState.textContent = "デバイスのファイルを編集、上書き";
              editState.classList.remove("fade-right");
              editState.classList.add("fade-left");
            }, 30);
          }, 2500);
        }

      } else {
        if (uploadAvailable) {
          alert("編集機能はこのブラウザまたはこの環境で使えないみたい😭😭\nブラウザを変えてお試しください\nこの環境ではファイルの閲覧のみ可能です");
          uploadAvailable = false;
        }
        upload.click();
        editState.classList.remove("fade-left");
        editState.classList.add("fade-right");
        setTimeout(() => {
          editState.innerHTML = "<strike style='font-style: italic;'>デバイスのファイルを編集、上書き</strike><br>デバイスのファイルを閲覧";
          edit.textContent = "閲覧";
          editState.classList.remove("fade-right");
          editState.classList.add("fade-left");
        }, 30);
      }
    });
    // 上書き保存ボタンがクリックされた時
    editSave.addEventListener("click", async () => {
      if (!fileHandle) {
        return;
      }

      const editSaveCheck = confirm("上書き保存しますか？\n編集内容がファイルに上書きされて保存されます\n新規保存したい場合は上の「保存」ボタンから");
      editSaveState.classList.remove("fade-left");
      editSaveState.classList.add("fade-right");

      if (editSaveCheck) {
        try {
          const writable = await fileHandle.createWritable();
          const text = textarea.value;
          await writable.write(text);
          await writable.close();
          setTimeout(() => {
            editSaveState.style.color = "#fd5";
            editSaveState.textContent = "上書き保存しました";
            editSaveState.classList.remove("fade-right");
            editSaveState.classList.add("fade-left");
          }, 30);
        } catch (err) {
          setTimeout(() => {
            editSaveState.style.color = "#fd5";
            editSaveState.textContent = "保存できませんでした...";
            editSaveState.classList.remove("fade-right");
            editSaveState.classList.add("fade-left");
          }, 30);
        }
        setTimeout(() => {
          editState.classList.remove("fade-left");
          editState.classList.add("fade-right");
          editSaveState.style.color = "";
          editSaveState.textContent = "内容をデバイスに上書き保存";
          editSaveLabel.style.display = "none";
          editLabel.style.display = "flex";
          edit.textContent = "上書き保存";
          setTimeout(() => {
            editState.style.color = "";
            editState.textContent = "デバイスのファイルを編集、上書き";
            editState.classList.remove("fade-right");
            editState.classList.add("fade-left");
            setTimeout(() => {
              edit.textContent = "編集";
            }, 400);
          }, 30);
        }, 2500);
      } else {
        setTimeout(() => {
          editSaveState.style.color = "#fd5";
          editSaveState.textContent = "キャンセルしました";
          editSaveState.classList.remove("fade-right");
          editSaveState.classList.add("fade-left");
        }, 30);
        setTimeout(() => {
          editSaveState.classList.remove("fade-left");
          editSaveState.classList.add("fade-right");
          setTimeout(() => {
            editSaveState.style.color = "";
            editSaveState.textContent = "内容をデバイスに上書き保存";
            editSaveState.classList.remove("fade-right");
            editSaveState.classList.add("fade-left");
          }, 30);
        }, 2500);
      }
    });
    //showOpenFilePicker()が利用不可の時は new FileReader()
    upload.addEventListener("click", (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        textarea.value = e.target.result;
        timeStatsUndoredo();
      };
      reader.readAsText(file);
    });
// #endregion
