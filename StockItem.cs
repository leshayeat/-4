namespace WarehouseApp
{
    public class StockItem
    {
        public string Name { get; set; }
        public int Quantity { get; set; }
        public string Category { get; set; }

        public override string ToString()
        {
            return $"{Name} | Категория: {Category} | Остаток: {Quantity} шт.";
        }
    }
}
