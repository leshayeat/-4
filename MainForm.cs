using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;

namespace WarehouseApp
{
    public partial class MainForm : Form
    {
        // Коллекция товаров
        private List<StockItem> stockItems = new List<StockItem>();

        // Флаг для фильтра "только дефицит"
        private bool showDeficitOnly = false;

        // Элементы интерфейса
        private Label lblTitle;
        private Label lblName;
        private TextBox txtName;
        private Label lblQuantity;
        private NumericUpDown numQuantity;
        private Label lblCategory;
        private ComboBox cmbCategory;
        private Button btnAdd;
        private Label lblSearch;
        private TextBox txtSearch;
        private ListBox listBoxItems;
        private Button btnPlus;
        private Button btnMinus;
        private Button btnDeficit;
        private Label lblStats;
        private Label lblWarning;

        public MainForm()
        {
            InitializeComponent();
            SetupForm();
            AddTestData();
            RefreshList();
        }

        private void SetupForm()
        {
            // Форма
            this.Text = "📦 Складской учёт";
            this.Size = new Size(650, 550);
            this.BackColor = Color.FromArgb(25, 25, 40);
            this.StartPosition = FormStartPosition.CenterScreen;

            // Заголовок
            lblTitle = new Label();
            lblTitle.Text = "📦 УПРАВЛЕНИЕ СКЛАДОМ";
            lblTitle.Font = new Font("Arial", 14, FontStyle.Bold);
            lblTitle.ForeColor = Color.Cyan;
            lblTitle.AutoSize = true;
            lblTitle.Location = new Point(180, 10);
            this.Controls.Add(lblTitle);

            // ----- БЛОК ДОБАВЛЕНИЯ -----
            int leftCol = 20;
            int topRow = 50;

            lblName = new Label();
            lblName.Text = "Название товара:";
            lblName.ForeColor = Color.LightGray;
            lblName.AutoSize = true;
            lblName.Location = new Point(leftCol, topRow);
            this.Controls.Add(lblName);

            txtName = new TextBox();
            txtName.Size = new Size(200, 25);
            txtName.Location = new Point(leftCol, topRow + 20);
            txtName.Font = new Font("Arial", 10);
            this.Controls.Add(txtName);

            lblQuantity = new Label();
            lblQuantity.Text = "Количество:";
            lblQuantity.ForeColor = Color.LightGray;
            lblQuantity.AutoSize = true;
            lblQuantity.Location = new Point(leftCol + 210, topRow);
            this.Controls.Add(lblQuantity);

            numQuantity = new NumericUpDown();
            numQuantity.Size = new Size(80, 25);
            numQuantity.Location = new Point(leftCol + 210, topRow + 20);
            numQuantity.Minimum = 1;
            numQuantity.Maximum = 9999;
            numQuantity.Value = 10;
            numQuantity.Font = new Font("Arial", 10);
            this.Controls.Add(numQuantity);

            lblCategory = new Label();
            lblCategory.Text = "Категория:";
            lblCategory.ForeColor = Color.LightGray;
            lblCategory.AutoSize = true;
            lblCategory.Location = new Point(leftCol + 300, topRow);
            this.Controls.Add(lblCategory);

            cmbCategory = new ComboBox();
            cmbCategory.Size = new Size(160, 25);
            cmbCategory.Location = new Point(leftCol + 300, topRow + 20);
            cmbCategory.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbCategory.Font = new Font("Arial", 10);
            cmbCategory.Items.AddRange(new string[] { "Электроника", "Продукты", "Одежда", "Хозтовары", "Канцелярия" });
            cmbCategory.SelectedIndex = 0;
            this.Controls.Add(cmbCategory);

            btnAdd = new Button();
            btnAdd.Text = "➕ Добавить товар";
            btnAdd.Font = new Font("Arial", 10, FontStyle.Bold);
            btnAdd.Size = new Size(140, 35);
            btnAdd.Location = new Point(leftCol + 470, topRow + 15);
            btnAdd.BackColor = Color.SeaGreen;
            btnAdd.ForeColor = Color.White;
            btnAdd.FlatStyle = FlatStyle.Flat;
            btnAdd.Cursor = Cursors.Hand;
            btnAdd.Click += BtnAdd_Click;
            this.Controls.Add(btnAdd);

            // ----- БЛОК ПОИСКА -----
            int searchY = topRow + 60;

            lblSearch = new Label();
            lblSearch.Text = "🔍 Живой поиск:";
            lblSearch.ForeColor = Color.LightGray;
            lblSearch.AutoSize = true;
            lblSearch.Location = new Point(leftCol, searchY);
            this.Controls.Add(lblSearch);

            txtSearch = new TextBox();
            txtSearch.Size = new Size(250, 25);
            txtSearch.Location = new Point(leftCol + 110, searchY - 3);
            txtSearch.Font = new Font("Arial", 10);
            txtSearch.TextChanged += TxtSearch_TextChanged;
            this.Controls.Add(txtSearch);

            // Кнопка фильтра "Только дефицит"
            btnDeficit = new Button();
            btnDeficit.Text = "⚠️ Только дефицит";
            btnDeficit.Font = new Font("Arial", 9, FontStyle.Bold);
            btnDeficit.Size = new Size(150, 30);
            btnDeficit.Location = new Point(leftCol + 380, searchY - 5);
            btnDeficit.BackColor = Color.DarkOrange;
            btnDeficit.ForeColor = Color.White;
            btnDeficit.FlatStyle = FlatStyle.Flat;
            btnDeficit.Cursor = Cursors.Hand;
            btnDeficit.Click += BtnDeficit_Click;
            this.Controls.Add(btnDeficit);

            // ----- СПИСОК ТОВАРОВ -----
            int listY = searchY + 40;

            listBoxItems = new ListBox();
            listBoxItems.Size = new Size(400, 180);
            listBoxItems.Location = new Point(leftCol, listY);
            listBoxItems.Font = new Font("Consolas", 10);
            listBoxItems.BackColor = Color.FromArgb(40, 40, 60);
            listBoxItems.ForeColor = Color.White;
            listBoxItems.SelectedIndexChanged += ListBoxItems_SelectedIndexChanged;
            this.Controls.Add(listBoxItems);

            // ----- КНОПКИ + / - -----
            btnPlus = new Button();
            btnPlus.Text = "➕ +1";
            btnPlus.Font = new Font("Arial", 11, FontStyle.Bold);
            btnPlus.Size = new Size(80, 40);
            btnPlus.Location = new Point(leftCol + 420, listY + 20);
            btnPlus.BackColor = Color.DodgerBlue;
            btnPlus.ForeColor = Color.White;
            btnPlus.FlatStyle = FlatStyle.Flat;
            btnPlus.Cursor = Cursors.Hand;
            btnPlus.Click += BtnPlus_Click;
            this.Controls.Add(btnPlus);

            btnMinus = new Button();
            btnMinus.Text = "➖ -1";
            btnMinus.Font = new Font("Arial", 11, FontStyle.Bold);
            btnMinus.Size = new Size(80, 40);
            btnMinus.Location = new Point(leftCol + 420, listY + 70);
            btnMinus.BackColor = Color.IndianRed;
            btnMinus.ForeColor = Color.White;
            btnMinus.FlatStyle = FlatStyle.Flat;
            btnMinus.Cursor = Cursors.Hand;
            btnMinus.Click += BtnMinus_Click;
            this.Controls.Add(btnMinus);

            // ----- ПРЕДУПРЕЖДЕНИЕ -----
            lblWarning = new Label();
            lblWarning.Text = "";
            lblWarning.Font = new Font("Arial", 11, FontStyle.Bold);
            lblWarning.ForeColor = Color.Red;
            lblWarning.AutoSize = true;
            lblWarning.Location = new Point(leftCol, listY + 190);
            this.Controls.Add(lblWarning);

            // ----- СТАТИСТИКА -----
            lblStats = new Label();
            lblStats.Text = "📊 Статистика загружается...";
            lblStats.Font = new Font("Arial", 11, FontStyle.Bold);
            lblStats.ForeColor = Color.Gold;
            lblStats.AutoSize = true;
            lblStats.Location = new Point(leftCol, listY + 220);
            this.Controls.Add(lblStats);
        }

        private void AddTestData()
        {
            stockItems.Add(new StockItem { Name = "Ноутбук", Quantity = 5, Category = "Электроника" });
            stockItems.Add(new StockItem { Name = "Мышь", Quantity = 2, Category = "Электроника" });
            stockItems.Add(new StockItem { Name = "Хлеб", Quantity = 15, Category = "Продукты" });
            stockItems.Add(new StockItem { Name = "Молоко", Quantity = 1, Category = "Продукты" });
            stockItems.Add(new StockItem { Name = "Футболка", Quantity = 8, Category = "Одежда" });
        }

        private void RefreshList()
        {
            listBoxItems.Items.Clear();

            IEnumerable<StockItem> itemsToShow = stockItems;

            // Фильтр "только дефицит"
            if (showDeficitOnly)
            {
                itemsToShow = itemsToShow.Where(item => item.Quantity < 3);
                btnDeficit.Text = "✅ Показать все";
                btnDeficit.BackColor = Color.SeaGreen;
            }
            else
            {
                btnDeficit.Text = "⚠️ Только дефицит";
                btnDeficit.BackColor = Color.DarkOrange;
            }

            // Живой поиск по названию
            string searchText = txtSearch.Text.Trim().ToLower();
            if (!string.IsNullOrEmpty(searchText))
            {
                itemsToShow = itemsToShow.Where(item =>
                    item.Name.ToLower().Contains(searchText));
            }

            foreach (StockItem item in itemsToShow)
            {
                listBoxItems.Items.Add(item);
            }

            UpdateStats();
            UpdateWarning();
        }

        private void UpdateStats()
        {
            int totalItems = stockItems.Sum(item => item.Quantity);
            int totalTypes = stockItems.Count;
            int deficitCount = stockItems.Count(item => item.Quantity < 3);

            lblStats.Text = $"📊 Всего товаров: {totalItems} шт. | Типов: {totalTypes} | Дефицитных позиций: {deficitCount}";
        }

        private void UpdateWarning()
        {
            if (listBoxItems.SelectedItem is StockItem selectedItem)
            {
                if (selectedItem.Quantity < 5)
                {
                    lblWarning.Text = "⚠️ СРОЧНО ТРЕБУЕТСЯ ЗАКУПКА!";
                    lblWarning.ForeColor = Color.Red;
                }
                else
                {
                    lblWarning.Text = "";
                }
            }
            else
            {
                lblWarning.Text = "";
            }
        }

        private void ListBoxItems_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateWarning();
        }

        private void TxtSearch_TextChanged(object sender, EventArgs e)
        {
            // Живой поиск — обновляем список при каждом изменении текста
            RefreshList();
        }

        private void BtnAdd_Click(object sender, EventArgs e)
        {
            string name = txtName.Text.Trim();

            if (string.IsNullOrEmpty(name))
            {
                MessageBox.Show(
                    "Введите название товара!",
                    "Ошибка",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
                return;
            }

            StockItem newItem = new StockItem
            {
                Name = name,
                Quantity = (int)numQuantity.Value,
                Category = cmbCategory.SelectedItem.ToString()
            };

            stockItems.Add(newItem);

            // Очистка полей
            txtName.Clear();
            numQuantity.Value = 10;
            txtName.Focus();

            RefreshList();
        }

        private void BtnPlus_Click(object sender, EventArgs e)
        {
            ChangeQuantity(1);
        }

        private void BtnMinus_Click(object sender, EventArgs e)
        {
            ChangeQuantity(-1);
        }

        private void ChangeQuantity(int delta)
        {
            // Получаем выбранный элемент из ListBox
            StockItem selectedItem = listBoxItems.SelectedItem as StockItem;

            if (selectedItem == null)
            {
                MessageBox.Show(
                    "Выберите товар из списка!",
                    "Ошибка",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
                return;
            }

            // Не даём уйти в минус
            if (selectedItem.Quantity + delta < 0)
            {
                MessageBox.Show(
                    "Количество не может быть отрицательным!",
                    "Ошибка",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
                return;
            }

            // Находим объект в коллекции по индексу и меняем его
            int selectedIndex = listBoxItems.SelectedIndex;

            // Получаем отображаемый список (с учётом фильтров)
            List<StockItem> displayedItems = GetDisplayedItems();

            if (selectedIndex >= 0 && selectedIndex < displayedItems.Count)
            {
                StockItem itemToChange = displayedItems[selectedIndex];

                // Находим этот же объект в основной коллекции
                int realIndex = stockItems.IndexOf(itemToChange);
                if (realIndex >= 0)
                {
                    stockItems[realIndex].Quantity += delta;
                }
            }

            RefreshList();

            // Восстанавливаем выбор
            if (selectedIndex < listBoxItems.Items.Count)
            {
                listBoxItems.SelectedIndex = selectedIndex;
            }
        }

        private List<StockItem> GetDisplayedItems()
        {
            List<StockItem> displayed = new List<StockItem>();
            foreach (object item in listBoxItems.Items)
            {
                if (item is StockItem stockItem)
                {
                    displayed.Add(stockItem);
                }
            }
            return displayed;
        }

        private void BtnDeficit_Click(object sender, EventArgs e)
        {
            showDeficitOnly = !showDeficitOnly;
            RefreshList();
        }
    }
}
