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
                        <form action="{{route('admin.products.update', $product->id)}}" method="POST" enctype="multipart/form-data">
                            @csrf
                            @method('PUT')
                            <div class="row">                                
                                    <div class="mb-3">
                                        <label for="simpleinput" class="form-label">Product code</label>
                                        <input type="text" id="simpleinput" class="form-control" name="product_code" value="{{$product->product_code}}">
                                        @error('product_code')
                                            <p class="text-danger">{{ $message }}</p>
                                        @enderror
                                    </div>
                                    <div class="mb-3">
                                        <label for="example-email" class="form-label">Product name</label>
                                        <input type="text" id="example-email" class="form-control  @error('product_name')
                                        is-invalid @enderror" name="product_name" value="{{$product->product_name}}">
                                        @error('product_name')
                                            <p class="text-danger">{{ $message }}</p>
                                        @enderror
                                    </div>

                                    <div class="mb-3">
                                        <label for="example-email" class="form-label">Original price</label>
                                        <input type="number" id="example-email" class="form-control @error('original_price') is-invalid @enderror"
                                            name="original_price" value="{{$product->original_price}}">
                                        @error('original_price')
                                            <div class="invalid-feedback">{{ $message }}</div>
                                        @enderror
                                    </div>

                                    <div class="mb-3">
                                        <label for="example-email" class="form-label">Discounted price</label>
                                        <input type="number" id="example-email" class="form-control @error('discounted_price') is-invalid @enderror"
                                            name="discounted_price" value="{{$product->discounted_price}}">
                                        @error('discounted_price')
                                            <div class="invalid-feedback">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    <div class="col-lg-3">
                                        <div class="mb-3">
                                            <label for="example-password" class="form-label">Category</label>
                                            <select class="form-select" aria-label="Default select example" name="category_id">
                                                @foreach ($category as $item)
                                                    <option value="{{$item->id}}" {{ $item->id == $product->category_id ? 'selected' : '' }}>{{$item->category_name}}</option>
                                                @endforeach                                                                                    
                                            </select>
                                        </div>
                                    </div>

                                    <div class="col-lg-3">
                                        <div class="mb-3">
                                            <label for="example-password" class="form-label">Thương hiệu</label>
                                            <select class="form-select @error('brand_id') is-invalid @enderror" name="brand_id">
                                                @foreach ($listBrand as $item)
                                                    <option value="{{ $item->id }}" {{ old('brand_id') == $item->brand_id ? 'selected' : '' }}>
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

                                                    <option value="0" {{ old('gender') == $item->gender ? 'selected' : '' }}>
                                                       Nữ
                                                    </option>
                                                    <option value="1" {{ old('gender') == $item->gender ? 'selected' : '' }}>
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
                                            <label for="example-password" class="form-label">Is show home</label>
                                            <select class="form-select" aria-label="Default select example" name="is_show_home">
                                                <option value="1">Display</option>
                                                <option value="0">Hide</option>
                                            </select>
                                        </div>
                                    </div>

                                    {{-- <div class="mb-3">
                                        <label for="example-password" class="form-label">Status</label>
                                        <select class="form-select" aria-label="Default select example" name="status">
                                            <option value="1" {{ $product->status == 1 ? 'selected' : '' }}>active</option>
                                            <option value="0" {{ $product->status == 0 ? 'selected' : '' }}>inactive</option>
                                        </select>
                                    </div> --}}

                                    <div id="variant-table" >                                            
                                                <div class="variant-row row align-items-end mb-3">    
                                                    @foreach ($listVariant as $index => $variant)                                                                                                                             
                                                        <div class="col-md-1 mb-1">
                                                            <label for="simpleinput" class="form-label">Size</label>
                                                            <select class="form-select"
                                                                name="product_variants[{{ $index  }}][product_size_id]">
                                                                @foreach ($size as $item)
                                                                    <option value="{{ $item->id }}"
                                                                        {{  old("product_variants.$index.product_size_id", $variant->product_size_id)
                                                                                    == $item->id ? 'selected' : '' }}>
                                                                        {{ $item->name }}
                                                                    </option>
                                                                @endforeach
                                                            </select>
                                                        </div>

                                                        <div class="col-md-2 mb-1">
                                                            <label for="simpleinput"
                                                                class="form-label">Quantity</label>
                                                            <input type="number" class="form-control"
                                                                name="product_variants[{{ $index  }}][quantity]"
                                                                value="{{ old("product_variants.$index .quantity", $variant->quantity) }}"
                                                                placeholder="Quantity" >
                                                            @error("product_variants.$index .quantity")
                                                                <p class="text-danger position-absolute">
                                                                    {{ $message }}</p>
                                                            @enderror
                                                        </div>
                                                        {{-- <div class="col-md-2 mb-1">
                                                            <label for="status" class="form-label">Status</label>
                                                            <select class="form-select" name="product_variants[{{ $index }}][status]">
                                                                <option value="1" {{ old("product_variants.$index.status", $variant->status ?? 1) == 1 ? 'selected' : '' }}>Hiển thị</option>
                                                                <option value="0" {{ old("product_variants.$index.status", $variant->status ?? 1) == 0 ? 'selected' : '' }}>Ẩn</option>
                                                            </select>
                                                        </div> --}}
                                                        {{-- <div class="col-md-1">
                                                            <button type="button"class="remove-row btn btn-danger">Xóa</button>
                                                        </div> --}}
                                                    @endforeach
                                                </div>

                                        </div>

                                        <div class="col-lg-3">
                                                <button type="button" id="add-variant" class="btn btn-success mb-2">➕
                                                             Thêm Biến Thể</button>
                                         </div>


                                    <div class="mb-3">
                                        <label for="mo_ta_ngan" class="form-label">Description</label> <br>
                                        <div id="quill-editor" style="height: 400px;">
                                        </div>
                                        <textarea name="description" id="editor_content" class="d-none">{{$product->description}}</textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label for="mo_ta_ngan" class="form-label">Hưỡng dẫn bảo quản giày</label> <br>
                                        <div id="quill-editor1" style="height: 400px;">
                                        </div>
                                        <textarea name="care_instructions" id="editor_content1" class="d-none">{{$product->care_instructions}}</textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label for="image" class="form-label">Image</label>
                                        <input type="file" id="image" name="image" class="form-control"
                                            onchange="showIamge(event)">
                                        <img id="img_product" src="{{$product->image}}" alt="hinh anh" style="width:150px">
                                    </div>
                                    <div class="mb-3">
                                        <label for="hinh_anh" class="form-label">Album product</label>
                                        <i id="add-row" class="mdi mdi-plus text-muted fs-18 rounded-2 border ms-3 p-1"
                                            style="cursor: pointer"></i>
                                        <table class="table align-middle table-nowrap mb-0">
                                            <tbody id="image-table-body">
                                                @foreach ($product->imageProduct as $index => $image)
                                                    <tr>
                                                        <td class="d-flex align-items-center">
                                                            <img id="preview_{$index}"
                                                                src="{{$image->image_product}}"
                                                                alt="hinh anh" style="width:50px" class="me-3">
                                                            <input type="file" id="hinh_anh" name="list_image[{{$image->id}}]" class="form-control" onchange="previewImage(this,{{$index}})">
                                                            <input type="hidden" name="list_image[{{$image->id}}]" value="{{$image->id}}">
                                                        </td>
                                                        <td class="">
                                                            <i class="mdi mdi-delete text-muted fs-18 rounded-2 border p-1" style="cursor: pointer"
                                                                onclick="removeRow(this)"></i>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>

                            </div>
                            <div class="d-flex"><button type="submit" class="btn btn-primary">Update</button>
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
            var old_content = `{!! $product->description !!}`;
            quill.root.innerHTML = old_content

            // Cập nhật lại textarea ẩn khi nội dung của  quill-editor thay đổi
            quill.on('text-change', function () {
                var html = quill.root.innerHTML;
                document.getElementById('editor_content').value = html
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
            var rowCount = {{count($product->imageProduct)}};
            document.getElementById('add-row').addEventListener('click', function () {
                var tableBody = document.getElementById('image-table-body')
                var newRow = document.createElement('tr');
                  newRow = `
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
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var quill = new Quill("#quill-editor1", {
                theme: "snow",
            })

            // Hiển thị nội dung cũ 
            var old_content = `{!! $product->care_instructions !!}`;
            quill.root.innerHTML = old_content

            // Cập nhật lại textarea ẩn khi nội dung của  quill-editor thay đổi
            quill.on('text-change', function () {
                var html = quill.root.innerHTML;
                document.getElementById('editor_content1').value = html
            })
        })


    </script>
@endsection