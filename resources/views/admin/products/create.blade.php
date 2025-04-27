@extends('admin.layouts.master')
@section('content')
    <!-- Start Content-->
    <div class="container-xxl">

        <div class="py-3 d-flex align-items-sm-center flex-sm-row flex-column">
            <div class="flex-grow-1">
                <h4 class="fs-18 fw-semibold m-0">{{$title}}</h4>
            </div>
        </div>

        <!-- General Form -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <form action="{{route('admin.products.store')}}" method="POST" enctype="multipart/form-data">
                            @csrf
                            <div class="row">

                                        <div class="mb-3">
                                            <label for="simpleinput" class="form-label"><strong>Mã sản phẩm</strong> </label>
                                            <input type="text" id="simpleinput" class="form-control @error('product_code') is-invalid @enderror"
                                                name="product_code" value="{{ old('product_code') }}">
                                            @error('product_code')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>

                                        <div class="mb-3">
                                            <label for="example-email" class="form-label"><strong>Tên sản phẩm</strong> </label>
                                            <input type="text" id="example-email" class="form-control @error('product_name') is-invalid @enderror"
                                                name="product_name" value="{{ old('product_name') }}">
                                            @error('product_name')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>

                                        <div class="mb-3">
                                            <label for="example-email" class="form-label"><strong>Giá sản phẩm</strong></label>
                                            <input type="number" id="example-email" class="form-control @error('original_price') is-invalid @enderror"
                                                name="original_price" value="{{ old('original_price') }}">
                                            @error('original_price')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>

                                        <div class="mb-3">
                                            <label for="example-email" class="form-label"><strong>Giá khuyến mãi</strong></label>
                                            <input type="number" id="example-email" class="form-control @error('discounted_price') is-invalid @enderror"
                                                name="discounted_price" value="{{ old('discounted_price') }}">
                                            @error('discounted_price')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>


                                        <div class="col-lg-3">
                                            <div class="mb-3">
                                                <label for="example-password" class="form-label"><strong>Danh mục</strong></label>
                                                <select class="form-select @error('category_id') is-invalid @enderror" name="category_id">
                                                    @foreach ($listCategories as $item)
                                                        <option value="{{ $item->id }}" {{ old('category_id') == $item->id ? 'selected' : '' }}>
                                                            {{ $item->category_name }}
                                                        </option> 
                                                    @endforeach                                                                                    
                                                </select>
                                                @error('category_id')
                                                    <div class="invalid-feedback">{{ $message }}</div>
                                                @enderror
                                            </div>
                                        </div>

                                        <div class="col-lg-3">
                                            <div class="mb-3">
                                                <label for="example-password" class="form-label"><strong>Thương hiệu</strong></label>
                                                <select class="form-select @error('brand_id') is-invalid @enderror" name="brand_id">
                                                    @foreach ($listBrand as $item)
                                                        <option value="{{ $item->id }}" {{ old('brand_id') == $item->id ? 'selected' : '' }}>
                                                            {{ $item->brand_name }}
                                                        </option>
                                                    @endforeach
                                                </select>
                                                @error('brand_id')
                                                    <div class="invalid-feedback">{{ $message }}</div>
                                                @enderror
                                            </div>
                                        </div>

                                        <div class="col-lg-3">
                                            <div class="mb-3">
                                                <label for="example-password" class="form-label">Giới tính</label>
                                                <select class="form-select @error('gender') is-invalid @enderror" name="gender">

                                                    <option value="0" {{ old('gender') }}>
                                                        Nữ
                                                    </option>
                                                    <option value="1" {{ old('gender') }}>
                                                        Nam
                                                    </option>

                                                </select>
                                                @error('gender')
                                                    <div class="invalid-feedback">{{ $message }}</div>
                                                @enderror
                                            </div>
                                        </div>
                                        <div class="col-lg-3">
                                            <div class="mb-3">
                                                <label for="example-password" class="form-label"><strong>Is show home</strong></label>
                                                <select class="form-select" aria-label="Default select example" name="is_show_home">
                                                    <option value="1">Display</option>
                                                    <option value="0">Hide</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div id="variant-table">
                                            @foreach (old('product_variants', [0 => []]) as $key => $variant)
                                                <label for="simpleinput" class="form-label"><strong>Biến thể sản phẩm</strong></label>
                                                    <div class="variant-row row align-items-end mb-3">                                                                                                                                                                                    
                                                        <div class="col-md-2">

                                                            <select class="form-select"
                                                                name="product_variants[{{ $key }}][product_size_id]">
                                                                @foreach ($size as $item)
                                                                    <option value="{{ $item->id }}"
                                                                        {{ old("product_variants.$key.product_size_id") == $item->id ? 'selected' : '' }}>
                                                                        {{ $item->name }}
                                                                    </option>
                                                                @endforeach
                                                            </select>
                                                        </div>

                                                        <div class="col-md-2">                                                      
                                                            <input type="number" class="form-control"
                                                                name="product_variants[{{ $key }}][quantity]"
                                                                value="{{ old("product_variants.$key.quantity") }}"
                                                                placeholder="Quantity">
                                                            @error("product_variants.$key.quantity")
                                                                <p class="text-danger position-absolute">
                                                                    {{ $message }}</p>
                                                            @enderror
                                                        </div>

                                                        <div class="col-md-2">
                                                            <button type="button"class="remove-row btn btn-danger">Xóa</button>
                                                        </div>
                                                        @error("product_variants")
                                                        <p class="text-danger position-absolute">
                                                            {{ $message }}
                                                        </p>
                                                         @enderror
                                                    </div>
                                            @endforeach
                                             
                                        </div>
                                      
                                        <div class="col-lg-3">
                                                <button type="button" id="add-variant" class="btn btn-success mb-2">➕
                                                             Thêm Biến Thể</button>
                                         </div>


                                        <div class="mb-3">
                                            <label for="mo_ta_ngan" class="form-label"><strong>Mô Tả sản phẩm</strong></label> <br>
                                            <div id="quill-editor" style="height: 400px;">
                                            </div>
                                            <textarea name="description" id="editor_content" class="d-none"></textarea>
                                        </div>

                                        <div class="mb-3">
                                            <label for="mo_ta_ngan" class="form-label"><strong>Hưỡng dẫn bảo quản giày</strong></label> <br>
                                            <div id="quill-editor1" style="height: 400px;">
                                            </div>
                                            <textarea name="care_instructions" id="editor_content1" class="d-none"></textarea>
                                        </div>

                                        <div class="mb-3">
                                            <label for="image" class="form-label"><strong>Hình ảnh</strong></label>
                                            <input type="file" id="image" name="image" class="form-control" onchange="showIamge(event)">
                                            <img id="img_product" alt="hinh anh" style="width:150px; display: none">
                                        </div>

                                        <div class="mb-3">
                                            <label for="hinh_anh" class="form-label"><strong>Album hình ảnh</strong></label>
                                            <i id="add-row" class="mdi mdi-plus text-muted fs-18 rounded-2 border ms-3 p-1" style="cursor: pointer"></i>
                                            <table class="table align-middle table-nowrap mb-0">
                                                <tbody id="image-table-body">
                                                    <tr>
                                                        <td class="d-flex align-items-center">
                                                            <img id="preview_0"
                                                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0Wr3oWsq6KobkPqznhl09Wum9ujEihaUT4Q&s"
                                                                alt="hinh anh" style="width:50px" class="me-3">
                                                            <input type="file" id="hinh_anh" name="list_image[id_0]" class="form-control"
                                                                onchange="previewImage(this,0)">
                                                        </td>
                                                        <td class="">
                                                            <i class="mdi mdi-delete text-muted fs-18 rounded-2 border p-1" style="cursor: pointer"
                                                                onclick="removeRow(this)"></i>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>                                      
                            </div>
                            <div class="d-flex"><button type="submit" class="btn btn-primary">Thêm mới</button>
                        </form>        
                    </div>

                </div>
            </div>
        </div>       
    </div> <!-- container-fluid -->
@endsection
@section('js')
    <script src="{{asset('admins/libs/quill/quill.core.js')}}"></script>
    <script src="{{asset('admins/libs/quill/quill.min.js')}}"></script>

        <script>
            document.addEventListener('DOMContentLoaded', function () {
                    var quill = new Quill("#quill-editor", {
                        theme: "snow",
                    })

                    // Hiển thị nội dung cũ 
                    var old_content = `{!! old('description') !!}`;
                    quill.root.innerHTML = old_content

                    // Cập nhật lại textarea ẩn khi nội dung của  quill-editor thay đổi
                    quill.on('text-change', function () {
                        var html = quill.root.innerHTML;
                        document.getElementById('editor_content').value = html
                    })
                })

        </script>

        <script>
            document.addEventListener('DOMContentLoaded', function () {
                var quill = new Quill("#quill-editor1", {
                    theme: "snow",
                })

                // Hiển thị nội dung cũ 
                var old_content = `{!! old('care_instructions') !!}`;
                quill.root.innerHTML = old_content

                // Cập nhật lại textarea ẩn khi nội dung của  quill-editor thay đổi
                quill.on('text-change', function () {
                    var html = quill.root.innerHTML;
                    document.getElementById('editor_content1').value = html
                })
            })

        </script>

        <script>
            function showIamge(event) {
                const img_product = document.getElementById('img_product');
                const file = event.target.files[0];
                const reader = new FileReader();
                reader.onload = function () {
                    img_product.src = reader.result;
                    img_product.style.display = 'block';
                }
                if (file) {
                    reader.readAsDataURL(file)
                }
            }
        </script>
        <script>
            document.addEventListener('DOMContentLoaded', function () {
                var rowCount = 1;
                document.getElementById('add-row').addEventListener('click', function () {
                    var tableBody = document.getElementById('image-table-body')
                    var newRow = document.createElement('tr');
                    newRow.innerHTML = ` 
                            <td class="d-flex align-items-center">
                                <img id="preview_${rowCount}" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0Wr3oWsq6KobkPqznhl09Wum9ujEihaUT4Q&s" alt="hinh anh"
                                    style="width:50px" class="me-3">
                                <input type="file" id="hinh_anh" name="list_image[id_${rowCount}]"
                                    class="form-control" onchange="previewImage(this,${rowCount})">                                                            
                            </td>
                            <td class="">
                                <i class="mdi mdi-delete text-muted fs-18 rounded-2 border p-1" 
                                style="cursor: pointer" onclick="removeRow(this)"></i>
                            </td>
                            `;
                    tableBody.appendChild(newRow);
                    rowCount++;
                });
            })

            function previewImage(input, rowIndex) {
                if (input.files && input.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        document.getElementById(`preview_${rowIndex}`).setAttribute('src', e.target.result)
                    }
                    reader.readAsDataURL(input.files[0])
                }
            }
            function removeRow(item) {
                var row = item.closest('tr');
                row.remove();
            }
        </script>
        <script>
            $(document).ready(function () {
                let index =
                    {{ count(old('product_variants', [0 => []])) - 1 }}; // Lấy số lượng biến thể đã có từ old()

                // Thêm biến thể mới
                $("#add-variant").click(function () {
                    index++;
                    let newRow = `
                    <div class="variant-row row align-items-end mb-3">

                         <div class="col-md-2">
                            <select class="form-select" name="product_variants[${index}][product_size_id]">
                                @foreach ($size as $item)
                                    <option value="{{ $item->id }}">
                                        {{ $item->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>                         
                        <div class="col-md-2">
                            <input type="number" class="form-control" name="product_variants[${index}][quantity]" 
                                   placeholder="Quantity">
                        </div>
                        <div class="col-md-2">
                            <button type="button" class="remove-row btn btn-danger">Xóa</button>
                        </div>
                    </div>
                `;
                    $("#variant-table").append(newRow);
                });

                // Xóa biến thể
                $(document).on("click", ".remove-row", function () {
                    $(this).closest(".variant-row").remove();
                });
            });
        </script>
@endsection