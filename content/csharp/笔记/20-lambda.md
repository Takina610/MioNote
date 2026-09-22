```csharp
using System;

namespace ConsoleApp1
{
    public delegate int MyDele(int a, int b);


    class Program
    {
        static void Main()
        {
            MyDele myDele = (a, b) => a + b;

            Console.WriteLine(myDele(1, 2));
        }
    }
}
```
