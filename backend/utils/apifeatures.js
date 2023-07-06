class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    console.log('Inside filter()');
    const queryCopy = { ...this.queryStr };
    const removeFields = ["keyword", "page", "limit"];
  
    removeFields.forEach((key) => delete queryCopy[key]);
  
    const priceLte = parseFloat(this.queryStr['price[lte]']);
    const priceGte = parseFloat(this.queryStr['price[gte]']);
  
    console.log('Price LTE:', priceLte);
    console.log('Price GTE:', priceGte);
  
    if (!isNaN(priceLte)) {
      console.log('Inside priceLte condition');
      queryCopy.price = { ...(queryCopy.price || {}), $lte: priceLte };
    }
    if (!isNaN(priceGte)) {
      console.log('Inside priceGte condition');
      queryCopy.price = { ...(queryCopy.price || {}), $gte: priceGte };
    }
  
    console.log('Query Copy:', queryCopy);
  
    let queryStr = JSON.stringify(queryCopy);
    console.log('Query String:', queryStr);
  
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);
    console.log('Updated Query String:', queryStr);
  
    this.query = this.query.find(JSON.parse(queryStr));
    console.log('Updated Query:', this.query);
  
    return this;
  }
  

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;

    const skip = resultPerPage * (currentPage - 1);

    this.query = this.query.limit(resultPerPage).skip(skip);

    return this;
  }
}

module.exports = ApiFeatures;