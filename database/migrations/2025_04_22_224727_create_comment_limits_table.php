<?php

   use Illuminate\Database\Migrations\Migration;
   use Illuminate\Database\Schema\Blueprint;
   use Illuminate\Support\Facades\Schema;

   class CreateCommentLimitsTable extends Migration
   {
       public function up()
       {
           Schema::create('comment_limits', function (Blueprint $table) {
               $table->id();
               $table->unsignedBigInteger('user_id');
               $table->integer('comment_count')->default(0);
               $table->date('date');
               $table->unique(['user_id', 'date']);
               $table->timestamps();
               $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
           });
       }

       public function down()
       {
           Schema::dropIfExists('comment_limits');
       }
   }