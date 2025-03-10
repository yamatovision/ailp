const fs = require('fs');
const path = require('path');

// Base64エンコードされたシンプルな画像データ（灰色の背景に「No Image」テキスト）
const placeholderImageBase64 = `
iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAACXBIWXMAAAsTAAALEwEAmpwYAAAF
pmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0w
TXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRh
LyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuZGFiYWNiYiwgMjAyMS8wNC8x
NC0wMDozOTo0NCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9y
Zy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9
IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0
cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25z
LmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5j
b20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAv
c1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIz
LjAgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA3LTE1VDEyOjM0OjUxKzA5OjAw
IiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wNy0xNVQxMjozNTozNCswOTowMCIgeG1wOk1ldGFkYXRh
RGF0ZT0iMjAyMy0wNy0xNVQxMjozNTozNCswOTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBo
b3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2
LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozZmIzZmYyMC01ZTM0LTRjYzQtYmMwMC05
YTRiNTQ3ZTg2YTAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6M2ZiM2ZmMjAtNWUzNC00Y2M0
LWJjMDAtOWE0YjU0N2U4NmEwIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6M2Zi
M2ZmMjAtNWUzNC00Y2M0LWJjMDAtOWE0YjU0N2U4NmEwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6
U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1w
LmlpZDozZmIzZmYyMC01ZTM0LTRjYzQtYmMwMC05YTRiNTQ3ZTg2YTAiIHN0RXZ0OndoZW49IjIw
MjMtMDctMTVUMTI6MzQ6NTErMDk6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rv
c2hvcCAyMy4wIChNYWNpbnRvc2gpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3Jk
ZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/
PlzTUCAAAAlYSURBVHic7d1NbBxnHcfx/8zs2mvHiZ30JW5LW9KQUlQhISFxopwaOCBUIYFAQkJC
ggsXDhwoVzhw5MKBC5cqF6QKIVQuxQWpAvGS9pC2tKRJaZqkSd3Urh3vete7OzPPw+FxdjeOvYl3
vX/b/n6kkTM7XntXmv313Z3ZZxwiAgCm+bNdAACOi8ACYEZgoRIfl4/Lp+WR+bRMm9y8XW6VN8hj
8mm5/B6+/iy5Wm6Xx+fTcmU+LdfJRa/Zg80KAqsUu+QBuUkeljfLTnmdvFyul2vkCrmk9dXmJA3I
kLwhz8lL8rS8LPvlefmX/Ff+Kc/Ja1Vv7By5VG6UN8pt8kG5RXawNxpDYDXCkevlTnmvfEjeJFsb
9thJeVaelKPyvByVFzN/5ikvbbJR9sheedDLnV7u8dLt5RF5Sp6Q1+XJDPuJnCdn5Fn5k/xFHpI9
2V8HN+K12wgv18v75WPyIel8gNcdlDPZ90P54v8fxM1nO2ODl+0Z2+vlHi9Fkn+T/Z09TmAtiJdr
5ZNyr7xL2t7huSbkeXlafpoX+SgvJ+b7Gvmr3p2x1V62edmcXX9U/iR/lkPn+HzvkA/IJ+Re6T/H
xzKDwFqoLfIR+ax8VLrP8ljjckCelKGk+JecSYq/y0TSPCbjyWkvZ2ZsLCnGkqI8S5m1UtcZO5yx
oYwd87Ivw9fJ5+Qx+bG8eI7PuVXeL5+Rj0j3OR7LBALrfHbK/fJ5uadFzz8l/5EnJEl+Lc/7+f0w
/r12Lzt8/n1a7vPzH893yk/kr/KXFm3DLvmAfF4+KztbtA6nFYF1Lj3yfvma3N6C5xY5IA/L4aT4
sZxKil/LdFL8Vmby4k+SNBPnfzWxJd8WRhxLvr1j7/byAZ9LVn+UR+Sn0rwj9lq5Uz4nH5ae87xG
0xFYC/GQ3JcUsxl7QA76/Nt7k+KnnKWM5aV/9QMrOl7Sd8aGMna9l7dk+JP8Sn7Tgm3dJe+TL8qt
LXhukwis6m6Vr8iHJWnBc+/3+fe5k+K3FdlKvl1d+YD3kmx2xnZl7Fsylo/pL+Vwi7b9bfJx+Yps
a9Hzm0FgnV2vfEm+IB0teP5n8mId9fn3nSlj49lyxtIWbMPZ7HTGvh/yLzpP+vzbbB/Sr8tzLdjm
PvmifFm6WvD8JhBYZ/c1+axELXru9+XxurS+lxSDKWMPlWYrY/dLxzL23aQ46fNv0F+UccnaL+Wr
5dqGFm1HJB+Sr0s7fguOgcBaiPfJZ1r0zEn5dmn2aDl2amXsC5KU5p9Jip/JRFJ8L2OhRM7YJ73c
mbH3+vwL8dfkaAs252PyqRY9sykIrHLd8jX5aCta7+XRzuzxcm1HCzrgHXbGupPidGnm9Xo99W6X
n/+Hly95uVna5VX5puwrX9Vi75cvSncLn39aEVjlXpcvyI6WNNfLz+Vw3axWQ7pZLYSX90i4MWP3
Zuw9PpcN/VV5UVrR8nfIF1v03NMGX90p95B8uDUt9vIz+WFdRtJmlb5YD/kBjW9lbEfGbuT1efmp
vNKKFr9bPlm+nqURWBUl+Zp8oBXt9fKUPJiXrKZqEtTlq8kJN+HlI17uz9j75J3SeJ+t2+RT5fdZ
CoFV0V55T0sa7OUv8v28FJmZrJrVkq9aUMbeJV/w8qy8eI7H3yPvacGmnXYEVkVJPiGba9/YXA78
Vn7gZapq1ayl0BNu1MsHvBz0+THc5/IJ+UTtG3ba0EloIa6VO1vQ2jPyr7qMDNa+aYv1hOvO2EP5
J4kh+UoLWnynXNeCdpomsNppZ4sbfMjnZ1Fus31M1hVu0sv9Xh6TQy1q7Ye0/bvRGlgJO+SOFjRy
Sh6uS/Oxcm3OmrRvYbxs9vJQL45c3u39HFyfDyZ8pUVbetq0w35pDmYXy+csaeiYPF6XkRnLxwLM
XVZOjng5lhSvh3w+CuMcrpVLqzzuRmn/s6sIrDZ4s2xu0bHPXB6XiXrFhx2Wy7cHqeU1yNhgUvxY
Dudt6DkHaZt0SbO30xoCqx3ukK6WNPNMPRdWw7ZaaBpbN6vnKpK05P1HE7rpuG0dRGC1w/Utamaq
Pi1n6uUfa1itXFblLXlSJuszMlG3aA3FTXIt6/BUZhFYbdCqgYFn6uXpqnlsZaxCOSP72CyC6o1W
rBuB1Q7bW9LGufoMw7OtjZh2xrYu/aHaZHuL2mkWgZXJDqpbW9jQicrkMsUx2E0taqpZBFZm/qlT
F5z+KrO2XdRO0wisNmmV3qU/RtvZujh2PENgIYPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACY
QWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwA
ZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAIL
gBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPA
AmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwg
sACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAz
CCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXA
DAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWAB
MIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBY
AMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkE
FgAzCCwAZhBYAMwgsACYQWABMIPAAmAGgQXADAILgBkEFgAzCCwAZvwPdQmCxHj29t0AAAAASUVO
RK5CYII=
`;

// Base64デコードして画像ファイルを作成
const base64Data = placeholderImageBase64.replace(/\s/g, ''); // 空白を削除
const buffer = Buffer.from(base64Data, 'base64');

// 画像を保存
const imgPath = path.join(__dirname, '..', 'public', 'assets', 'placeholder-image.jpg');
fs.writeFileSync(imgPath, buffer);

console.log(`プレースホルダー画像を保存しました: ${imgPath}`);