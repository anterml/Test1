window.addEventListener("DOMContentLoaded", async () => {
  let data
  let totalColsSum = []
  let heightRatio = 1
  const MAX_COLUMN_HEIGHT = 300
  const typeNames = ["dev", "test", "prod"]
  const colNames = ["front", "back", "db"]

  const urls = [
    "https://rcslabs.ru/ttrp1.json",
    "https://rcslabs.ru/ttrp2.json",
    "https://rcslabs.ru/ttrp3.json",
  ]

  fillControlUrls(urls)
  await loadData(urls[0])
  initDraw(data)

  // Заполнить <select> для выбора json данных
  function fillControlUrls(urls) {
    const elem = document.querySelector(".panel__control__urls")
    if (!elem || !Array.isArray(urls)) return

    elem.innerHTML = urls
      .map(url => `<option value="${url}">${url}</option>`)
      .join("")
    elem.addEventListener("change", async e => {
      await loadData(e.target.value)
      redraw(data)
    })
  }

  async function loadData(url) {
    try {
      const response = await fetch(url)
      data = await response.json()
      const maxColumnHeight = calcMaxColumnHeight(data)
      heightRatio = (MAX_COLUMN_HEIGHT / maxColumnHeight).toFixed(2)
    } catch {
      console.error("Не получилось загрузить данные", url)
    }
  }

  function calcMaxColumnHeight(data) {
    let max = -Infinity
    totalColsSum = []
    for (const typeName of typeNames) {
      const sum = Object.keys(data[typeName]).reduce(
        (sum, colName) => sum + data[typeName][colName],
        0,
      )
      totalColsSum.push(sum)
      if (sum > max) max = sum
    }
    return max
  }

  function initDraw() {
    setTitle()
    const graphElem = document.querySelector(".graph")
    if (graphElem) graphElem.innerHTML = initDrawCols(data, typeNames, colNames)
  }

  function redraw(data) {
    // обновляем данные столбиков
    typeNames.forEach(typeName => {
      const elems = document.querySelectorAll(
        `[data-${typeName}] .cols__item__type`,
      )

      colNames.forEach((colName, i) => {
        elems[i].style.height = data[typeName][colName] * heightRatio + "px"
        elems[i].textContent = data[typeName][colName]
      })
    })

    // обновляем % падение\подъема
    Array.from(document.querySelectorAll(".diff")).forEach((elem, i) => {
      const direction = totalColsSum[i] > totalColsSum[i + 1] ? "-" : "+"
      const diff = totalColsSum[i] / totalColsSum[i + 1]
      elem.dataset.direction = direction
      const value = Math.abs(parseInt(diff * 100 - 100))
      const elemValue = elem.querySelector(".diff__value")
      if (elemValue) {
        elemValue.textContent = `${direction}${value}`
      }
      elem.style.display = value === 0 ? "none" : ""
    })

    // обновляем норму
    const normElem = document.querySelector("[data-norm] .cols__item__type")
    if (normElem) {
      normElem.style.height = data.norm * heightRatio + "px"
      const valueElem = normElem.querySelector("span")
      if (valueElem) valueElem.textContent = data.norm
    }

    // обновляем заголовок
    setTitle()
  }

  function setTitle() {
    const titleElem = document.querySelector(".header__title")
    if (titleElem)
      titleElem.textContent = `Количество пройденных тестов "${data.title}"`
  }

  function initDrawCols(data, typeNames, colNames) {
    const html = typeNames.map((typeName, i) => {
      const htmlColItems = colNames.map(colName => {
        const height = data[typeName][colName] * heightRatio
        return `<div class="cols__item__type" style="height: ${height}px">
          ${data[typeName][colName]}
        </div>`
      })

      let diffHtml = ""
      if (i !== 0) {
        const direction = totalColsSum[i - 1] > totalColsSum[i] ? "-" : "+"
        const diff = totalColsSum[i - 1] / totalColsSum[i]

        diffHtml = `<div class="diff" data-${typeName} data-direction="${direction}">
          <img src="images/arrow-down.svg" />
          <span class="diff__value">${direction} ${Math.abs(
          parseInt(diff * 100 - 100),
        )}</span>
        </div>`
      }

      return `<div class="cols" data-${typeName}>
        ${diffHtml}
        <div class="cols__item">
          ${htmlColItems.join("")}
        </div>
        <div class="cols__title">${typeName}</div>
      </div>`
    })

    return `${html.join("")}
      <div class="cols" data-norm>
        <div class="cols__item">
          <div class="cols__item__type" style="height: ${
            data.norm * heightRatio
          }px">
            <span>${data.norm}</span>
          </div>
        </div>
        <div class="cols__title">Норматив</div>
      </div>`
  }
})
