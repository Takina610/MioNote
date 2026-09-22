```csharp
using System;

namespace ConsoleApp1
{
    class Program
    {
        static void Main()
        {
            int[] arr = { 1, 2, 3, 4, 5 };

            foreach (int item in arr)
            {
                Console.WriteLine(item);
            }
        }
    }
}
```

- foreach 是只读的循环，item 本质是复制一份的，所以不能修改
