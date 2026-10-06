# Khmer-prompt Python eval with executable tests.
# Usage (Colab/GPU): python eval_khmer_code.py [adapter_dir]   (omit = baseline)
# Usage (Termux self-test of the harness): python eval_khmer_code.py --selftest
import json, sys, re, subprocess, tempfile, textwrap, os

TASKS = [
 ('សរសេរ Python function `add(a, b)` ដែលបូកចំនួនពីរ', 'add', 'assert add(2,3)==5 and add(-1,1)==0'),
 ('សរសេរ Python function `add(a, b)` ដែលបូកចំនួនពីរ', 'add', 'assert add(0,0)==0 and add(10,5)==15'),
 ('សរសេរ Python function `add(a, b)` ដែលបូកចំនួនពីរ', 'add', 'assert add(-5,-7)==-12 and add(100,-40)==60'),
 ('សរសេរ Python function `add(a, b)` ដែលបូកចំនួនពីរ', 'add', 'assert add(999,1)==1000 and add(1,-999)==-998'),
 ('សរសេរ Python function `add(a, b)` ដែលបូកចំនួនពីរ', 'add', 'assert add(-100,250)==150 and add(7,0)==7'),
 ('សរសេរ Python function `is_even(n)` ត្រឡប់ True បើ n ជាលេខគូ', 'is_even', 'assert is_even(4) and not is_even(7)'),
 ('សរសេរ Python function `is_even(n)` ត្រឡប់ True បើ n ជាលេខគូ', 'is_even', 'assert is_even(0) and is_even(2) and not is_even(3)'),
 ('សរសេរ Python function `is_even(n)` ត្រឡប់ True បើ n ជាលេខគូ', 'is_even', 'assert is_even(-8) and not is_even(-5)'),
 ('សរសេរ Python function `is_even(n)` ត្រឡប់ True បើ n ជាលេខគូ', 'is_even', 'assert is_even(100) and not is_even(101)'),
 ('សរសេរ Python function `is_even(n)` ត្រឡប់ True បើ n ជាលេខគូ', 'is_even', 'assert is_even(-100) and not is_even(-99)'),
 ('សរសេរ Python function `reverse_str(s)` ដែលត្រឡប់ អក្សរ ចុះក្រោយ', 'reverse_str', "assert reverse_str('abc')=='cba' and reverse_str('')==''"),
 ('សរសេរ Python function `reverse_str(s)` ដែលត្រឡប់ អក្សរ ចុះក្រោយ', 'reverse_str', "assert reverse_str('hello')=='olleh'"),
 ('សរសេរ Python function `reverse_str(s)` ដែលត្រឡប់ អក្សរ ចុះក្រោយ', 'reverse_str', "assert reverse_str('a')=='a' and reverse_str('ab')=='ba'"),
 ('សរសេរ Python function `reverse_str(s)` ដែលត្រឡប់ អក្សរ ចុះក្រោយ', 'reverse_str', "assert reverse_str('12345')=='54321'"),
 ('សរសេរ Python function `reverse_str(s)` ដែលត្រឡប់ អក្សរ ចុះក្រោយ', 'reverse_str', "assert reverse_str('Khmer')=='remhK'"),
 ('សរសេរ Python function `factorial(n)` គណនា n!', 'factorial', 'assert factorial(0)==1 and factorial(5)==120'),
 ('សរសេរ Python function `factorial(n)` គណនា n!', 'factorial', 'assert factorial(1)==1 and factorial(3)==6'),
 ('សរសេរ Python function `factorial(n)` គណនា n!', 'factorial', 'assert factorial(2)==2 and factorial(4)==24'),
 ('សរសេរ Python function `factorial(n)` គណនា n!', 'factorial', 'assert factorial(6)==720'),
 ('សរសេរ Python function `factorial(n)` គណនា n!', 'factorial', 'assert factorial(7)==5040'),
 ('សរសេរ Python function `fib(n)` ត្រឡប់លេខ Fibonacci ទី n (fib(0)=0, fib(1)=1)', 'fib', 'assert [fib(i) for i in range(7)]==[0,1,1,2,3,5,8]'),
 ('សរសេរ Python function `fib(n)` ត្រឡប់លេខ Fibonacci ទី n (fib(0)=0, fib(1)=1)', 'fib', 'assert fib(0)==0 and fib(1)==1'),
 ('សរសេរ Python function `fib(n)` ត្រឡប់លេខ Fibonacci ទី n (fib(0)=0, fib(1)=1)', 'fib', 'assert fib(8)==21 and fib(9)==34'),
 ('សរសេរ Python function `fib(n)` ត្រឡប់លេខ Fibonacci ទី n (fib(0)=0, fib(1)=1)', 'fib', 'assert fib(10)==55'),
 ('សរសេរ Python function `fib(n)` ត្រឡប់លេខ Fibonacci ទី n (fib(0)=0, fib(1)=1)', 'fib', 'assert fib(12)==144'),
 ('សរសេរ Python function `max_of(xs)` ត្រឡប់តម្លៃធំបំផុតក្នុង list', 'max_of', 'assert max_of([3,9,2])==9 and max_of([-5,-2])==-2'),
 ('សរសេរ Python function `max_of(xs)` ត្រឡប់តម្លៃធំបំផុតក្នុង list', 'max_of', 'assert max_of([1])==1 and max_of([5,4,3])==5'),
 ('សរសេរ Python function `max_of(xs)` ត្រឡប់តម្លៃធំបំផុតក្នុង list', 'max_of', 'assert max_of([-10,-20,-3])==-3'),
 ('សរសេរ Python function `max_of(xs)` ត្រឡប់តម្លៃធំបំផុតក្នុង list', 'max_of', 'assert max_of([100,1,50,99])==100'),
 ('សរសេរ Python function `max_of(xs)` ត្រឡប់តម្លៃធំបំផុតក្នុង list', 'max_of', 'assert max_of([0,-1,-2])==0'),
 ('សរសេរ Python function `count_vowels(s)` រាប់ស្រៈ a,e,i,o,u (មិនប្រកាន់អក្សរធំតូច)', 'count_vowels', "assert count_vowels('Hello')==2 and count_vowels('xyz')==0"),
 ('សរសេរ Python function `count_vowels(s)` រាប់ស្រៈ a,e,i,o,u (មិនប្រកាន់អក្សរធំតូច)', 'count_vowels', "assert count_vowels('AEIOU')==5"),
 ('សរសេរ Python function `count_vowels(s)` រាប់ស្រៈ a,e,i,o,u (មិនប្រកាន់អក្សរធំតូច)', 'count_vowels', "assert count_vowels('python')==1"),
 ('សរសេរ Python function `count_vowels(s)` រាប់ស្រៈ a,e,i,o,u (មិនប្រកាន់អក្សរធំតូច)', 'count_vowels', "assert count_vowels('HELLO WORLD')==3"),
 ('សរសេរ Python function `count_vowels(s)` រាប់ស្រៈ a,e,i,o,u (មិនប្រកាន់អក្សរធំតូច)', 'count_vowels', "assert count_vowels('bcdfg')==0"),
 ('សរសេរ Python function `is_palindrome(s)` ពិនិត្យថា s ជា palindrome', 'is_palindrome', "assert is_palindrome('abba') and not is_palindrome('abc')"),
 ('សរសេរ Python function `is_palindrome(s)` ពិនិត្យថា s ជា palindrome', 'is_palindrome', "assert is_palindrome('a') and is_palindrome('')"),
 ('សរសេរ Python function `is_palindrome(s)` ពិនិត្យថា s ជា palindrome', 'is_palindrome', "assert is_palindrome('racecar') and not is_palindrome('python')"),
 ('សរសេរ Python function `is_palindrome(s)` ពិនិត្យថា s ជា palindrome', 'is_palindrome', "assert is_palindrome('1221') and not is_palindrome('1234')"),
 ('សរសេរ Python function `is_palindrome(s)` ពិនិត្យថា s ជា palindrome', 'is_palindrome', "assert is_palindrome('aa') and not is_palindrome('ab')"),
 ('សរសេរ Python function `unique(xs)` ត្រឡប់ list ដែលគ្មានស្ទួន ដោយរក្សាលំដាប់ដើម', 'unique', 'assert unique([1,2,1,3,2])==[1,2,3]'),
 ('សរសេរ Python function `unique(xs)` ត្រឡប់ list ដែលគ្មានស្ទួន ដោយរក្សាលំដាប់ដើម', 'unique', 'assert unique([])==[] and unique([1])==[1]'),
 ('សរសេរ Python function `unique(xs)` ត្រឡប់ list ដែលគ្មានស្ទួន ដោយរក្សាលំដាប់ដើម', 'unique', "assert unique(['a','b','a','c'])==['a','b','c']"),
 ('សរសេរ Python function `unique(xs)` ត្រឡប់ list ដែលគ្មានស្ទួន ដោយរក្សាលំដាប់ដើម', 'unique', 'assert unique([3,3,2,1,2,1])==[3,2,1]'),
 ('សរសេរ Python function `unique(xs)` ត្រឡប់ list ដែលគ្មានស្ទួន ដោយរក្សាលំដាប់ដើម', 'unique', 'assert unique([1,1,1,1])==[1]'),
 ('សរសេរ Python function `flatten(xss)` បង្រួម list នៃ list ទៅជា list តែមួយ', 'flatten', 'assert flatten([[1,2],[3],[]])==[1,2,3]'),
 ('សរសេរ Python function `flatten(xss)` បង្រួម list នៃ list ទៅជា list តែមួយ', 'flatten', 'assert flatten([])==[] and flatten([[]])==[]'),
 ('សរសេរ Python function `flatten(xss)` បង្រួម list នៃ list ទៅជា list តែមួយ', 'flatten', 'assert flatten([[1],[2],[3]])==[1,2,3]'),
 ('សរសេរ Python function `flatten(xss)` បង្រួម list នៃ list ទៅជា list តែមួយ', 'flatten', 'assert flatten([[1,2,3],[],[4,5]])==[1,2,3,4,5]'),
 ('សរសេរ Python function `flatten(xss)` បង្រួម list នៃ list ទៅជា list តែមួយ', 'flatten', "assert flatten([['a','b'],['c']])==['a','b','c']"),
 ('សរសេរ Python function `word_count(s)` ត្រឡប់ dict រាប់ពាក្យ (បំបែកតាម space)', 'word_count', "assert word_count('a b a')=={'a':2,'b':1}"),
 ('សរសេរ Python function `word_count(s)` ត្រឡប់ dict រាប់ពាក្យ (បំបែកតាម space)', 'word_count', "assert word_count('hello')=={'hello':1}"),
 ('សរសេរ Python function `word_count(s)` ត្រឡប់ dict រាប់ពាក្យ (បំបែកតាម space)', 'word_count', "assert word_count('a a a')=={'a':3}"),
 ('សរសេរ Python function `word_count(s)` ត្រឡប់ dict រាប់ពាក្យ (បំបែកតាម space)', 'word_count', "assert word_count('one two two three')=={'one':1,'two':2,'three':1}"),
 ('សរសេរ Python function `word_count(s)` ត្រឡប់ dict រាប់ពាក្យ (បំបែកតាម space)', 'word_count', "assert word_count('x y x z y x')=={'x':3,'y':2,'z':1}"),
 ('សរសេរ Python function `is_prime(n)` ពិនិត្យលេខបឋម', 'is_prime', 'assert is_prime(2) and is_prime(13) and not is_prime(1) and not is_prime(9)'),
 ('សរសេរ Python function `is_prime(n)` ពិនិត្យលេខបឋម', 'is_prime', 'assert not is_prime(0) and not is_prime(-3)'),
 ('សរសេរ Python function `is_prime(n)` ពិនិត្យលេខបឋម', 'is_prime', 'assert is_prime(3) and is_prime(5) and not is_prime(4)'),
 ('សរសេរ Python function `is_prime(n)` ពិនិត្យលេខបឋម', 'is_prime', 'assert is_prime(17) and not is_prime(25)'),
 ('សរសេរ Python function `is_prime(n)` ពិនិត្យលេខបឋម', 'is_prime', 'assert is_prime(29) and not is_prime(30)'),
 ('សរសេរ Python function `gcd(a, b)` ត្រឡប់ ចែកធំបំផុតរួម', 'gcd', 'assert gcd(12,18)==6 and gcd(7,5)==1'),
 ('សរសេរ Python function `gcd(a, b)` ត្រឡប់ ចែកធំបំផុតរួម', 'gcd', 'assert gcd(0,18)==18 and gcd(18,0)==18'),
 ('សរសេរ Python function `gcd(a, b)` ត្រឡប់ ចែកធំបំផុតរួម', 'gcd', 'assert gcd(8,12)==4 and gcd(9,6)==3'),
 ('សរសេរ Python function `gcd(a, b)` ត្រឡប់ ចែកធំបំផុតរួម', 'gcd', 'assert gcd(100,40)==20'),
 ('សរសេរ Python function `gcd(a, b)` ត្រឡប់ ចែកធំបំផុតរួម', 'gcd', 'assert gcd(17,19)==1'),
 ('សរសេរ Python function `binary_search(xs, t)` ត្រឡប់ index ឬ -1 (xs តម្រៀបរួច)', 'binary_search', 'assert binary_search([1,3,5,7],5)==2 and binary_search([1,3],4)==-1'),
 ('សរសេរ Python function `binary_search(xs, t)` ត្រឡប់ index ឬ -1 (xs តម្រៀបរួច)', 'binary_search', 'assert binary_search([1],1)==0 and binary_search([1],2)==-1'),
 ('សរសេរ Python function `binary_search(xs, t)` ត្រឡប់ index ឬ -1 (xs តម្រៀបរួច)', 'binary_search', 'assert binary_search([1,2,3,4,5],1)==0'),
 ('សរសេរ Python function `binary_search(xs, t)` ត្រឡប់ index ឬ -1 (xs តម្រៀបរួច)', 'binary_search', 'assert binary_search([1,2,3,4,5],5)==4'),
 ('សរសេរ Python function `binary_search(xs, t)` ត្រឡប់ index ឬ -1 (xs តម្រៀបរួច)', 'binary_search', 'assert binary_search([-5,-2,0,4,9],-2)==1 and binary_search([-5,-2,0,4,9],8)==-1'),
 ('សរសេរ Python function `merge_sorted(a, b)` បញ្ចូល list តម្រៀបពីរជា list តម្រៀបមួយ', 'merge_sorted', 'assert merge_sorted([1,4],[2,3])==[1,2,3,4]'),
 ('សរសេរ Python function `merge_sorted(a, b)` បញ្ចូល list តម្រៀបពីរជា list តម្រៀបមួយ', 'merge_sorted', 'assert merge_sorted([],[])==[]'),
 ('សរសេរ Python function `merge_sorted(a, b)` បញ្ចូល list តម្រៀបពីរជា list តម្រៀបមួយ', 'merge_sorted', 'assert merge_sorted([], [1,2])==[1,2]'),
 ('សរសេរ Python function `merge_sorted(a, b)` បញ្ចូល list តម្រៀបពីរជា list តម្រៀបមួយ', 'merge_sorted', 'assert merge_sorted([1,3,5],[2,4,6])==[1,2,3,4,5,6]'),
 ('សរសេរ Python function `merge_sorted(a, b)` បញ្ចូល list តម្រៀបពីរជា list តម្រៀបមួយ', 'merge_sorted', 'assert merge_sorted([-3,0],[1,2])==[-3,0,1,2]'),
 ('សរសេរ Python function `celsius_to_f(c)` បំប្លែងអង្សាសេទៅហ្វារ៉ង់ហៃ', 'celsius_to_f', 'assert celsius_to_f(0)==32 and celsius_to_f(100)==212'),
 ('សរសេរ Python function `celsius_to_f(c)` បំប្លែងអង្សាសេទៅហ្វារ៉ង់ហៃ', 'celsius_to_f', 'assert celsius_to_f(-40)==-40'),
 ('សរសេរ Python function `celsius_to_f(c)` បំប្លែងអង្សាសេទៅហ្វារ៉ង់ហៃ', 'celsius_to_f', 'assert celsius_to_f(10)==50'),
 ('សរសេរ Python function `celsius_to_f(c)` បំប្លែងអង្សាសេទៅហ្វារ៉ង់ហៃ', 'celsius_to_f', 'assert celsius_to_f(20)==68'),
 ('សរសេរ Python function `celsius_to_f(c)` បំប្លែងអង្សាសេទៅហ្វារ៉ង់ហៃ', 'celsius_to_f', 'assert abs(celsius_to_f(37)-98.6)<1e-9'),
 ('សរសេរ Python function `capitalize_words(s)` ធ្វើអក្សរដំបូងនៃពាក្យនីមួយៗជាអក្សរធំ', 'capitalize_words', "assert capitalize_words('hi there')=='Hi There'"),
 ('សរសេរ Python function `capitalize_words(s)` ធ្វើអក្សរដំបូងនៃពាក្យនីមួយៗជាអក្សរធំ', 'capitalize_words', "assert capitalize_words('hello')=='Hello'"),
 ('សរសេរ Python function `capitalize_words(s)` ធ្វើអក្សរដំបូងនៃពាក្យនីមួយៗជាអក្សរធំ', 'capitalize_words', "assert capitalize_words('one two three')=='One Two Three'"),
 ('សរសេរ Python function `capitalize_words(s)` ធ្វើអក្សរដំបូងនៃពាក្យនីមួយៗជាអក្សរធំ', 'capitalize_words', "assert capitalize_words('')==''"),
 ('សរសេរ Python function `capitalize_words(s)` ធ្វើអក្សរដំបូងនៃពាក្យនីមួយៗជាអក្សរធំ', 'capitalize_words', "assert capitalize_words('python code')=='Python Code'"),
 ('សរសេរ Python function `sum_digits(n)` ត្រឡប់ផលបូកខ្ទង់នៃ n', 'sum_digits', 'assert sum_digits(123)==6 and sum_digits(0)==0'),
 ('សរសេរ Python function `sum_digits(n)` ត្រឡប់ផលបូកខ្ទង់នៃ n', 'sum_digits', 'assert sum_digits(999)==27'),
 ('សរសេរ Python function `sum_digits(n)` ត្រឡប់ផលបូកខ្ទង់នៃ n', 'sum_digits', 'assert sum_digits(10)==1'),
 ('សរសេរ Python function `sum_digits(n)` ត្រឡប់ផលបូកខ្ទង់នៃ n', 'sum_digits', 'assert sum_digits(-123)==6'),
 ('សរសេរ Python function `sum_digits(n)` ត្រឡប់ផលបូកខ្ទង់នៃ n', 'sum_digits', 'assert sum_digits(1000)==1'),
 ('សរសេរ Python function `transpose(m)` ត្រឡប់ matrix transpose (list នៃ list)', 'transpose', 'assert transpose([[1,2],[3,4]])==[[1,3],[2,4]]'),
 ('សរសេរ Python function `transpose(m)` ត្រឡប់ matrix transpose (list នៃ list)', 'transpose', 'assert transpose([[1,2,3],[4,5,6]])==[[1,4],[2,5],[3,6]]'),
 ('សរសេរ Python function `transpose(m)` ត្រឡប់ matrix transpose (list នៃ list)', 'transpose', 'assert transpose([[1],[2],[3]])==[[1,2,3]]'),
 ('សរសេរ Python function `transpose(m)` ត្រឡប់ matrix transpose (list នៃ list)', 'transpose', 'assert transpose([[1,2,3]])==[[1],[2],[3]]'),
 ('សរសេរ Python function `transpose(m)` ត្រឡប់ matrix transpose (list នៃ list)', 'transpose', 'assert transpose([[1,2],[3,4],[5,6]])==[[1,3,5],[2,4,6]]'),
 ('សរសេរ Python function `safe_div(a, b)` ត្រឡប់ None បើ b ស្មើ 0', 'safe_div', 'assert safe_div(6,3)==2 and safe_div(1,0) is None'),
 ('សរសេរ Python function `safe_div(a, b)` ត្រឡប់ None បើ b ស្មើ 0', 'safe_div', 'assert safe_div(10,2)==5'),
 ('សរសេរ Python function `safe_div(a, b)` ត្រឡប់ None បើ b ស្មើ 0', 'safe_div', 'assert safe_div(0,5)==0'),
 ('សរសេរ Python function `safe_div(a, b)` ត្រឡប់ None បើ b ស្មើ 0', 'safe_div', 'assert safe_div(-6,3)==-2'),
 ('សរសេរ Python function `safe_div(a, b)` ត្រឡប់ None បើ b ស្មើ 0', 'safe_div', 'assert safe_div(7,2)==3.5 and safe_div(5,0) is None'),
]

REFS = {  # reference solutions, used only by --selftest to validate the tests themselves
 "add":"def add(a,b): return a+b","is_even":"def is_even(n): return n%2==0",
 "reverse_str":"def reverse_str(s): return s[::-1]",
 "factorial":"def factorial(n):\n r=1\n for i in range(2,n+1): r*=i\n return r",
 "fib":"def fib(n):\n a,b=0,1\n for _ in range(n): a,b=b,a+b\n return a",
 "max_of":"def max_of(xs): return max(xs)",
 "count_vowels":"def count_vowels(s): return sum(c in 'aeiou' for c in s.lower())",
 "is_palindrome":"def is_palindrome(s): return s==s[::-1]",
 "unique":"def unique(xs):\n seen=set(); out=[]\n for x in xs:\n  if x not in seen: seen.add(x); out.append(x)\n return out",
 "flatten":"def flatten(x): return [i for s in x for i in s]",
 "word_count":"def word_count(s):\n d={}\n for w in s.split(): d[w]=d.get(w,0)+1\n return d",
 "is_prime":"def is_prime(n):\n if n<2: return False\n return all(n%i for i in range(2,int(n**.5)+1))",
 "gcd":"def gcd(a,b):\n while b: a,b=b,a%b\n return a",
 "binary_search":"def binary_search(xs,t):\n lo,hi=0,len(xs)-1\n while lo<=hi:\n  m=(lo+hi)//2\n  if xs[m]==t: return m\n  if xs[m]<t: lo=m+1\n  else: hi=m-1\n return -1",
 "merge_sorted":"def merge_sorted(a,b): return sorted(a+b)",
 "celsius_to_f":"def celsius_to_f(c): return c*9/5+32",
 "capitalize_words":"def capitalize_words(s): return ' '.join(w.capitalize() for w in s.split())",
 "sum_digits":"def sum_digits(n): return sum(int(c) for c in str(abs(n)))",
 "transpose":"def transpose(m): return [list(r) for r in zip(*m)]",
 "safe_div":"def safe_div(a,b): return None if b==0 else a/b",
}

def extract(text):
    m = re.search(r"```(?:python)?\n(.*?)```", text, re.S)
    return (m.group(1) if m else text).strip()

def run_test(code, test, timeout=5):
    src = code + "\n\n" + test + "\n"
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(src); p = f.name
    try:
        r = subprocess.run([sys.executable, p], capture_output=True, timeout=timeout)
        return r.returncode == 0
    except subprocess.TimeoutExpired:
        return False
    finally:
        os.unlink(p)

def selftest():
    bad = [n for _, n, t in TASKS if not run_test(REFS[n], t)]
    print(f"tasks: {len(TASKS)}  reference failures: {bad or 'none'}")
    return not bad

def generate(adapter):
    from unsloth import FastLanguageModel
    cfg = json.load(open("config.json", encoding="utf-8"))
    model, tok = FastLanguageModel.from_pretrained(adapter or cfg["model_name"],
        max_seq_length=cfg["max_seq_length"], load_in_4bit=True)
    FastLanguageModel.for_inference(model)
    def gen(prompt):
        ids = tok.apply_chat_template([{"role":"user","content":prompt}], add_generation_prompt=True,
                                      return_tensors="pt").to(model.device)
        out = model.generate(input_ids=ids, max_new_tokens=400, do_sample=False)
        return tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True)
    return gen

def main():
    if "--selftest" in sys.argv: sys.exit(0 if selftest() else 1)
    adapter = sys.argv[1] if len(sys.argv) > 1 else None
    gen = generate(adapter); passed = 0
    for prompt, name, test in TASKS:
        ok = run_test(extract(gen(prompt)), test); passed += ok
        print(("PASS " if ok else "FAIL ") + name)
    score = passed / len(TASKS)
    print(f"khmer_code_pass@1 = {score:.3f} ({passed}/{len(TASKS)})  adapter={adapter or 'BASELINE'}")
    json.dump({"adapter": adapter, "score": score}, open("eval_result.json", "w"))

if __name__ == "__main__": main()
