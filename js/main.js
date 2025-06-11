new Vue({
    el: '#app',
    data: {
        newIncome: '',
        incomes: [],
        newExpense: { name: '', amount: '' },
        expenses: [],
        debts: [
            { name: '阿福', calculation: '860', result: 860 },
            { name: '卢总', calculation: '900+390+1550', result: 2840 },
            // ... (保持原有的债务数据) ...
        ],
        newDebt: { name: '', expression: '' },
        editDebt: { index: -1, name: '', expression: '' },
        currentDate: ''
    },
    computed: {
        totalIncome() {
            const incomeSum = this.incomes.reduce((sum, income) => sum + income.amount, 0);
            const expenseSum = this.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
            return incomeSum - expenseSum;
        }
    },
    methods: {
        // ... (复制所有原有的方法) ...
    },
    mounted() {
        this.currentDate = this.getCurrentDate();
    }
});
