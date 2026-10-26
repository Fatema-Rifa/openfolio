class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }

  static ok(res, data, message = 'Success', meta = null) {
    return res.status(200).json(new ApiResponse(200, data, message, meta));
  }

  static created(res, data, message = 'Resource created successfully') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static noContent(res, message = 'Resource deleted successfully') {
    return res.status(200).json(new ApiResponse(200, null, message));
  }
}

module.exports = ApiResponse;
