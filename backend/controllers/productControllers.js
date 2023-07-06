const Product = require("../models/productModel")
const ErrorHandler = require("../utils/errorhander")
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures")
const cloudinary = require("cloudinary");

//create product -Admin route
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  const imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    let result;

    if (typeof images[i] === "string") {
      result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });
    } else {
      // Handle the case where images[i] is an object with public_id and url properties
      result = {
        public_id: images[i].public_id,
        secure_url: images[i].url,
      };
    }

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});

// get all products
// exports.getAllProducts = catchAsyncErrors(async(req,res,next) => {
//     const resultPerPage = 8
//     const productsCount = await Product.countDocuments()
//     const apiFeature = new ApiFeatures(Product.find(),req.query)
//     .search()
//     .filter()
    
//     let products = await apiFeature.query;

//     let filteredProductsCount = products.length;

//     apiFeature.pagination(resultPerPage);
    
//     products = await apiFeature.query;

//     res.status(201).json({
//         success:true,
//         products,
//         productsCount,
//         resultPerPage,
//         filteredProductsCount,
//     });
// });


exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const resultPerPage = 8;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || resultPerPage;
  const keyword = req.query.keyword;
  const category = req.query.category;
  const priceLte = parseFloat(req.query['price[lte]']);
  const priceGte = parseFloat(req.query['price[gte]']);

  const searchOptions = {};

  if (keyword) {
    searchOptions.name = { $regex: keyword, $options: "i" };
  }
  if (category) {
    searchOptions.category = category;
  }

  const query = Product.find(searchOptions);

  const apiFeatures = new ApiFeatures(query, req.query)
    .filter()
    .pagination(limit);

  const productsPromise = apiFeatures.query;
  const totalCountPromise = Product.countDocuments(searchOptions);

  const [products, totalCount] = await Promise.all([
    productsPromise,
    totalCountPromise,
  ]);

  res.status(200).json({
    success: true,
    products,
    productsCount: totalCount,
    resultPerPage,
    filteredProductsCount: products.length,
  });
});


exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

//get a product detail -- admin

exports.getProductDetails = catchAsyncErrors(async(req,res,next) =>{

    const product = await Product.findById(req.params.id)

    if(!product)
    {
        return next(new ErrorHandler("product not found", 404))
    }

    res.status(200).json({
        success: true,
        product
    })
})


exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Images Start Here
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting Images From Cloudinary
    for (let i = 0; i < product.images.length; i++) {
      await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});
  
// Delete Product

exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Deleting Images From Cloudinary
  for (let i = 0; i < product.images.length; i++) {
    await cloudinary.v2.uploader.destroy(product.images[i].public_id);
  }

  await Product.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});


exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }
  let isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );
 

  if (isReviewed) {
    isReviewed.rating = rating;
    isReviewed.comment = comment;
  } else {
    product.reviews.push(review);
    isReviewed = review;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;
  product.numOfReviews = product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});



  // Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  ratings = avg / reviews.length;
  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
