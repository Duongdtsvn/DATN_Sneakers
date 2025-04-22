<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <title>Admin Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="A fully featured admin theme which can be used to build CRM, CMS, etc." />
    <meta name="author" content="Zoyothemes" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    @include('admin.layouts.partials.css')

    <style>
        /* Ép hiển thị content và form */
        .content-page {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            min-height: 100vh !important;
            padding-bottom: 60px !important;
        }
        .content {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        .card-footer, .input-group, #message-form, #send-message {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    </style>
</head>

<body data-menu-color="light" data-sidebar="default">

    <!-- Begin page -->
    <div id="app-layout">

        <!-- Topbar Start -->
        @include('admin.layouts.components.topbar')
        <!-- end Topbar -->

        <!-- Left Sidebar Start -->
        @include('admin.layouts.components.leftbar')
        <!-- Left Sidebar End -->

        <!-- ============================================================== -->
        <!-- Start Page Content here -->
        <!-- ============================================================== -->
        <div class="content-page">
            <div class="content">

                <!-- Start Content-->
                @yield('content')

                <!-- container-fluid -->
            </div> <!-- content -->

            <!-- Footer Start -->
            @include('admin.layouts.components.footer')
            <!-- end Footer -->

        </div>
        <!-- ============================================================== -->
        <!-- End Page content -->
        <!-- ============================================================== -->

    </div>
    <!-- END wrapper -->

    @include('admin.layouts.partials.js')
    @if(Route::currentRouteName() === 'admin.dashboard')
        <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.41.0/dist/apexcharts.min.js"></script>
        <script src="{{ asset('js/analytics-dashboard.init.js') }}"></script>
    @endif
    @stack('scripts')

</body>

</html>