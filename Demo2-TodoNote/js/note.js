//DOM 元素
const taskInput = document.getElementById("task-input")  //待办事项输入栏
const addTaskBtn = document.getElementById("add-task")  //添加按钮
const todosList = document.getElementById("todos-list")  //todo 的 ul 列表
const itemsLeft = document.getElementById("items-left")  //剩余项数
const clearCompletedBtn = document.getElementById("clear-completed")  //清除所有已完成按钮
const clearAllBtn = document.getElementById("clear-all")
const emptyState = document.querySelector(".empty-state")  //无待办事项时显示的提示
const filters = document.querySelectorAll(".filter")  //过滤器
const finishAll = document.getElementById("finish-all")  //全部完成按钮
const dateElement = document.getElementById("date")

let todos = []
let currentFilter = "all"

//点击一次addTaskBtn(添加按钮)，会执行addTodo方法
addTaskBtn.addEventListener("click", () => {
  //addTodo方法，传入值是待办事项输入框的值
  addTodo(taskInput.value)
})

//检测键盘，若按下‘Enter’,则等同于点击了addTaskBtn按钮
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addTodo(taskInput.value)
  }
})

//点击清除已完成事项按钮，触发clearCompleted()
clearCompletedBtn.addEventListener("click", clearCompleted)

//点击清除全部按钮，触发clearAll()
clearAllBtn.addEventListener("click", clearAll)

//声明addTodo函数 作用：添加todo事项到容器中
function addTodo(text) {  //传入函数的是待办事项输入的字符串数据
  if (text.trim() === "") return
  const todo = {
    id: Date.now(),  //使用时间戳作为id属性
    text,  //文本属性
    completed: false  //完成属性
  }

  todos.push(todo)  //将todo对象推送到11行定义的todos数组中

  saveTodos()
  renderTodos()
  taskInput.value = ""  //重置输入框
}

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos))  //将todos对象以JSON字符串格式存储到本地
  updateItemsCount()  //选项数量更新函数
  checkEmptyState()  //检查是否有待办选项函数
}


//声明 选项数量更新函数
function updateItemsCount() {
  const uncompletedTodos = todos.filter(todo => !todo.completed)
  itemsLeft.textContent = `还剩 ${uncompletedTodos?.length} 项`  //剩余项数动态渲染
}

//声明 检查是否有待办选项函数
function checkEmptyState() {
  const filteredTodos = filterTodos(currentFilter) //currentFilter的定义在12行
  if (filteredTodos?.length === 0) emptyState.classList.remove("hidden")  //如果没有待办事项，就删除hidden，让提示显示出来
  else emptyState.classList.add("hidden")  //否则 让提示隐藏
}

function filterTodos(filter) {
  switch (filter) {
    case "active":
      return todos.filter(todo => !todo.completed);
    case "completed":
      return todos.filter((todo) => todo.completed)
    default:
      return todos;
  }
}

//主要功能：渲染待办事项
function renderTodos() {

  todosList.innerHTML = ""

  const filteredTodos = filterTodos(currentFilter)

  filteredTodos.forEach(todo => {  //todo对象 在33行定义
    const todoItem = document.createElement("li")  //创建一个小li
    todoItem.classList.add("common-box")  //为li添加todo-item样式
    if (todo.completed) todoItem.classList.add("completed")  //检查todo对象的completed属性，若为true，则为todoItem添加一个completed样式

    const checkboxContainer = document.createElement("label")  //创建一个label标签
    checkboxContainer.classList.add("checkbox-container")  //为label添加chechbox-container样式

    const checkbox = document.createElement("input")  //创建input标签
    checkbox.type = "checkbox"  //input属性设置为复选框(checkbox)
    checkbox.classList.add("todo-checkbox")  //添加todo-checkbox样式
    checkbox.checked = todo.completed  //复选框状态与todo对象的completed属性(true/false)绑定
    checkbox.addEventListener("change", () => toggleTodo(todo.id))  //checkbox发现改变时候，将todo的id属性传入toggleTodo函数并执行

    const checkmark = document.createElement("span") //添加span标签
    checkmark.classList.add("checkmark")  //为其添加checkmark样式

    //checkbox和checkmark归为label子元素
    checkboxContainer.appendChild(checkbox)
    checkboxContainer.appendChild(checkmark)

    const todoText = document.createElement("span")  //创建span标签
    todoText.classList.add("todo-cont")  //添加todo-item-text样式
    todoText.textContent = todo.text  //将todo对象中的text文本内容赋值到todoText(span标签)之中

    //创建删除按钮
    const deleteBtn = document.createElement("button")
    deleteBtn.classList.add("cancel")
    deleteBtn.classList.add("round-btn")
    deleteBtn.innerHTML = '<img src="images/cancel.png">'
    //点击删除按钮，会将todo对象的id属性传入deleteTodo函数并调用
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id))

    //将checkboxContainer，todoText和deleteBtn都划到todoItem(小li)下作为子元素
    todoItem.appendChild(checkboxContainer)
    todoItem.appendChild(todoText)
    todoItem.appendChild(deleteBtn)

    todosList.appendChild(todoItem)
  })
}

//声明清除按钮函数
function clearCompleted() {
  todos = todos.filter(todo => !todo.completed)
  saveTodos()
  renderTodos()
}

//一键清空所有内容函数
function clearAll() {
  todos = []
  saveTodos()
  renderTodos()
}

//声明toggleTodo函数
function toggleTodo(id) {
  todos = todos.map(todo => {
    if (todo.id === id) { //检查id是否匹配
      return { ...todo, completed: !todo.completed }  //切换completed的状态
    }

    return todo
  })

  saveTodos()
  renderTodos()
}

//声明deleteTodo函数
function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id)
  saveTodos()
  renderTodos()
}

function loadTodos() {
  const storedTodos = localStorage.getItem("todos")  //将本地存储的数组todos赋值给storedTodos
  if (storedTodos) todos = JSON.parse(storedTodos)  //若storedTodos不为空，将JSON字符串数据转换为数组赋值给todos
  renderTodos()
}

//获取过滤器
filters.forEach(filter => {
  filter.addEventListener("click", () => {
    setActiveFilter(filter.getAttribute("data-filter"))
  })
})

//声明过滤器设置函数
function setActiveFilter(filter) {
  currentFilter = filter

  filters.forEach(item => {
    if (item.getAttribute("data-filter") === filter) {
      item.classList.add("active")  //添加active样式
    } else {
      item.classList.remove("active")
    }
  })

  renderTodos()
}

function setDate() {
  const options = { weekday: "long", month: "short", day: "numeric" }

  dateElement.textContent = today.toLocaleDateString("zh-CN", options)
}

//加载待办事项
window.addEventListener("DOMContentLoaded", () => {
  loadTodos()
  updateItemsCount()
  setDate()
})

finishAll.addEventListener("click", () => {
  todos.forEach(todo => todo.completed = true);
  saveTodos();
  renderTodos();
});