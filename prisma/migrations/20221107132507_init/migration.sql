-- CreateTable
CREATE TABLE "point_keyframes" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "point_id" INTEGER NOT NULL,
    "sequence_id" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "point_keyframes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_frames" (
    "project_id" INTEGER NOT NULL,
    "sequence_id" SMALLINT NOT NULL,
    "blob" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "project_frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_points" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "multi" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT NOT NULL DEFAULT 'New Point',
    "data" JSONB,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "project_id" INTEGER,
    "object_class" TEXT,
    "object_id" TEXT,
    "thumbnail_blob" TEXT,
    "gallery_id" TEXT,

    CONSTRAINT "project_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "frame_rate" DOUBLE PRECISION,
    "name" TEXT,
    "total_frames" SMALLINT DEFAULT 0,
    "project_uuid" UUID NOT NULL,
    "thumbnail_blob" TEXT,
    "dataset_id" TEXT,
    "sample_id" TEXT,
    "user_uuid" TEXT,
    "frame_width" INTEGER,
    "frame_height" INTEGER,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "project_id" INTEGER,
    "dag_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "status" TEXT,
    "result" JSONB,
    "type" TEXT,
    "is_read" BOOLEAN,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("dag_id","run_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_uuid_key" ON "projects"("project_uuid");

-- AddForeignKey
ALTER TABLE "point_keyframes" ADD CONSTRAINT "point_keyframes_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "project_points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_points" ADD CONSTRAINT "project_points_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
