
function generateCustomerNo(prefix, count) {
    const customerNos = [];
    for (let i = 1; i <= count; i++) {
        const customerNo = `${prefix}${i}`;
        customerNos.push(customerNo);
    }
    return customerNos;
}


// const customerNumbers = generateCustomerNo("CC", 3);
// console.log(customerNumbers);
